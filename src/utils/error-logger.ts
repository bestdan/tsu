import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

/**
 * Configuration for error logging
 */
export interface ErrorLogConfig {
  /**
   * Enable or disable error logging
   * Can be controlled via TSU_ERROR_LOG environment variable
   */
  enabled: boolean;
  /**
   * Directory where error logs are stored
   * Defaults to ~/.tsu/logs
   */
  logDir: string;
}

/**
 * Error context information to be logged
 */
export interface ErrorContext {
  /**
   * Timestamp when the error occurred
   */
  timestamp: string;
  /**
   * Version of tsutils
   */
  version: string;
  /**
   * Node.js version
   */
  nodeVersion: string;
  /**
   * Operating system platform
   */
  platform: string;
  /**
   * Command that was executed
   */
  command: string;
  /**
   * Error message
   */
  error: string;
  /**
   * Stack trace (if available)
   */
  stack?: string;
  /**
   * Current working directory
   */
  cwd: string;
}

/**
 * Get error logging configuration
 * Checks TSU_ERROR_LOG environment variable and creates default config
 */
/* v8 ignore next -- @preserve */
export function getErrorLogConfig(): ErrorLogConfig {
  const enabled = process.env.TSU_ERROR_LOG !== 'false';
  const logDir = process.env.TSU_LOG_DIR || join(homedir(), '.tsu', 'logs');

  return {
    enabled,
    logDir,
  };
}

/**
 * Get package version from package.json
 */
/* v8 ignore next -- @preserve */
function getVersion(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const packageJsonPath = join(__dirname, '../../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

/**
 * Ensure log directory exists
 */
/* v8 ignore next -- @preserve */
function ensureLogDirectory(logDir: string): void {
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Sanitize error message to remove potential sensitive data
 * - Replaces home directory paths with tilde notation
 * - Removes potential secrets (anything that looks like keys/tokens)
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Replace home directory paths with tilde notation
  // This prevents leaking usernames in paths
  const homeDir = homedir();
  const escapedHomeDir = escapeRegex(homeDir);
  sanitized = sanitized.replace(new RegExp(escapedHomeDir, 'g'), '~');

  // Remove potential secrets (patterns like API keys, tokens)
  // Match common secret patterns but preserve error context
  // Use explicit pattern without word boundaries to handle hyphens/underscores correctly
  sanitized = sanitized.replace(
    /(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{30,})(?:$|[^A-Za-z0-9_-])/g,
    (match, captured) => {
      // Only redact if it looks like a secret (mixed case with numbers)
      if (/[A-Z]/.test(captured) && /[a-z]/.test(captured) && /[0-9]/.test(captured)) {
        return match.replace(captured, '[REDACTED]');
      }
      return match;
    }
  );

  return sanitized;
}

/**
 * Create error context for logging
 */
/* v8 ignore next -- @preserve */
export function createErrorContext(error: Error | string, command: string): ErrorContext {
  const errorObj = typeof error === 'string' ? new Error(error) : error;
  const cwd = process.cwd();
  const homeDir = homedir();
  const escapedHomeDir = escapeRegex(homeDir);

  return {
    timestamp: new Date().toISOString(),
    version: getVersion(),
    nodeVersion: process.version,
    platform: process.platform,
    command: sanitizeErrorMessage(command),
    error: sanitizeErrorMessage(errorObj.message),
    stack: errorObj.stack ? sanitizeErrorMessage(errorObj.stack) : undefined,
    cwd: cwd.replace(new RegExp(escapedHomeDir, 'g'), '~'),
  };
}

/**
 * Log an error to the local error log file
 * This is enabled by default and respects user privacy by:
 * - Only logging if TSU_ERROR_LOG is not set to 'false'
 * - Sanitizing error messages to remove sensitive data
 * - Storing logs locally (not sending to external services)
 * - Providing clear documentation on what is logged
 *
 * @param error - The error to log (Error object or string)
 * @param command - The command that was being executed
 */
/* v8 ignore next -- @preserve */
export function logError(error: Error | string, command: string): void {
  const config = getErrorLogConfig();

  // Only log if enabled
  if (!config.enabled) {
    return;
  }

  try {
    ensureLogDirectory(config.logDir);

    const context = createErrorContext(error, command);
    const logFile = join(config.logDir, 'errors.log');

    // Format log entry
    const logEntry = [
      '---',
      `Timestamp: ${context.timestamp}`,
      `Version: ${context.version}`,
      `Node: ${context.nodeVersion}`,
      `Platform: ${context.platform}`,
      `Command: ${context.command}`,
      `CWD: ${context.cwd}`,
      `Error: ${context.error}`,
      context.stack ? `Stack:\n${context.stack}` : '',
      '',
    ].join('\n');

    // Append to log file
    appendFileSync(logFile, logEntry);
  } catch {
    // Silently fail - we don't want logging errors to break the CLI
    // Users can enable verbose mode to see any issues
  }
}

/**
 * Get the path to the error log file
 */
/* v8 ignore next -- @preserve */
export function getErrorLogPath(): string {
  const config = getErrorLogConfig();
  return join(config.logDir, 'errors.log');
}

/**
 * Check if error logging is enabled
 */
/* v8 ignore next -- @preserve */
export function isErrorLoggingEnabled(): boolean {
  return getErrorLogConfig().enabled;
}
