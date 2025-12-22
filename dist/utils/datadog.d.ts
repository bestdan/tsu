import { v2 } from '@datadog/datadog-api-client';
export interface DataDogConfig {
    apiKey?: string;
    site?: string;
    enabled: boolean;
}
export declare function loadDataDogConfig(): DataDogConfig;
export declare function initializeDataDogClient(config: DataDogConfig): v2.LogsApi | null;
export declare enum DataDogLogLevel {
    INFO = "info",
    WARN = "warn",
    ERROR = "error"
}
export declare function sendLogToDataDog(logsApi: v2.LogsApi | null, message: string, level?: DataDogLogLevel, metadata?: Record<string, unknown>): Promise<void>;
export declare function createDataDogLogger(logsApi: v2.LogsApi | null): {
    info: (message: string, metadata?: Record<string, unknown>) => Promise<void>;
    warn: (message: string, metadata?: Record<string, unknown>) => Promise<void>;
    error: (message: string, metadata?: Record<string, unknown>) => Promise<void>;
};
