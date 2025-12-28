import { existsSync, mkdirSync, appendFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';
export function getErrorLogConfig() {
    const enabled = process.env.TSU_ERROR_LOG !== 'false';
    const logDir = process.env.TSU_LOG_DIR || join(homedir(), '.tsu', 'logs');
    return {
        enabled,
        logDir,
    };
}
function getVersion() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const packageJsonPath = join(__dirname, '../../package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version;
    }
    catch {
        return 'unknown';
    }
}
function ensureLogDirectory(logDir) {
    if (!existsSync(logDir)) {
        mkdirSync(logDir, { recursive: true });
    }
}
export function sanitizeErrorMessage(message) {
    let sanitized = message;
    const homeDir = homedir();
    sanitized = sanitized.replace(new RegExp(homeDir, 'g'), '~');
    sanitized = sanitized.replace(/\b[A-Za-z0-9_-]{20,}\b/g, (match) => {
        if (match.length > 30 && /[A-Z]/.test(match) && /[a-z]/.test(match) && /[0-9]/.test(match)) {
            return '[REDACTED]';
        }
        return match;
    });
    return sanitized;
}
export function createErrorContext(error, command) {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    const cwd = process.cwd();
    return {
        timestamp: new Date().toISOString(),
        version: getVersion(),
        nodeVersion: process.version,
        platform: process.platform,
        command,
        error: sanitizeErrorMessage(errorObj.message),
        stack: errorObj.stack ? sanitizeErrorMessage(errorObj.stack) : undefined,
        cwd: cwd.replace(homedir(), '~'),
    };
}
export function logError(error, command) {
    const config = getErrorLogConfig();
    if (!config.enabled) {
        return;
    }
    try {
        ensureLogDirectory(config.logDir);
        const context = createErrorContext(error, command);
        const logFile = join(config.logDir, 'errors.log');
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
        appendFileSync(logFile, logEntry);
    }
    catch {
    }
}
export function getErrorLogPath() {
    const config = getErrorLogConfig();
    return join(config.logDir, 'errors.log');
}
export function isErrorLoggingEnabled() {
    return getErrorLogConfig().enabled;
}
