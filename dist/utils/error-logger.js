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
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function sanitizeErrorMessage(message) {
    let sanitized = message;
    const homeDir = homedir();
    const escapedHomeDir = escapeRegex(homeDir);
    sanitized = sanitized.replace(new RegExp(escapedHomeDir, 'g'), '~');
    sanitized = sanitized.replace(/(?:^|[^A-Za-z0-9_-])([A-Za-z0-9_-]{30,})(?:$|[^A-Za-z0-9_-])/g, (match, captured) => {
        if (/[A-Z]/.test(captured) && /[a-z]/.test(captured) && /[0-9]/.test(captured)) {
            return match.replace(captured, '[REDACTED]');
        }
        return match;
    });
    return sanitized;
}
export function createErrorContext(error, command) {
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
