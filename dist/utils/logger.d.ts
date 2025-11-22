export declare enum LogLevel {
    INFO = "INFO",
    WARN = "WARN",
    ERROR = "ERROR"
}
export declare function log(message: string, level?: LogLevel): void;
export declare function logError(message: string): void;
export declare function logWarn(message: string): void;
export declare function logInfo(message: string): void;
export declare function logIfVerbose(verbose: boolean | undefined, message: string): void;
//# sourceMappingURL=logger.d.ts.map