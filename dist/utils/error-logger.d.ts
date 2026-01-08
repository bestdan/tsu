export interface ErrorLogConfig {
    enabled: boolean;
    logDir: string;
}
export interface ErrorContext {
    timestamp: string;
    version: string;
    nodeVersion: string;
    platform: string;
    command: string;
    error: string;
    stack?: string;
    cwd: string;
}
export declare function getErrorLogConfig(): ErrorLogConfig;
export declare function sanitizeErrorMessage(message: string): string;
export declare function createErrorContext(error: Error | string, command: string): ErrorContext;
export declare function logError(error: Error | string, command: string): void;
export declare function getErrorLogPath(): string;
export declare function isErrorLoggingEnabled(): boolean;
