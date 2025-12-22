import { client, v2 } from '@datadog/datadog-api-client';

/**
 * DataDog configuration options loaded from environment variables
 */
export interface DataDogConfig {
  apiKey?: string;
  site: string;
  enabled: boolean;
}

/**
 * Load DataDog configuration from environment variables
 * @returns DataDog configuration object
 */
export function loadDataDogConfig(): DataDogConfig {
  return {
    apiKey: process.env.DD_API_KEY,
    site: process.env.DD_SITE || 'datadoghq.com',
    enabled: !!process.env.DD_API_KEY,
  };
}

/**
 * Initialize DataDog client with configuration
 * @param config - DataDog configuration
 * @returns Initialized DataDog logs API client or null if not configured
 */
export function initializeDataDogClient(config: DataDogConfig): v2.LogsApi | null {
  if (!config.enabled || !config.apiKey) {
    return null;
  }

  const configuration = client.createConfiguration({
    authMethods: {
      apiKeyAuth: config.apiKey,
    },
  });

  configuration.setServerVariables({
    site: config.site,
  });

  return new v2.LogsApi(configuration);
}

/**
 * Log level enum for DataDog logs
 */
export enum DataDogLogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

/**
 * Send a log to DataDog
 * @param logsApi - DataDog logs API client
 * @param message - Log message
 * @param level - Log level
 * @param metadata - Additional metadata to include with the log
 */
export async function sendLogToDataDog(
  logsApi: v2.LogsApi | null,
  message: string,
  level: DataDogLogLevel = DataDogLogLevel.INFO,
  metadata?: Record<string, unknown>
): Promise<void> {
  if (!logsApi) {
    // DataDog not configured, skip logging
    return;
  }

  /* v8 ignore next -- @preserve */
  try {
    const logEntry: v2.HTTPLogItem = {
      ddsource: 'tsutils',
      ddtags: `env:${process.env.NODE_ENV || 'development'},level:${level}`,
      message,
      service: 'tsutils',
      ...metadata,
    };

    await logsApi.submitLog({
      body: [logEntry],
    });
  } catch (error) {
    // Silently fail if DataDog logging fails - we don't want to break the application
    // In production, you might want to log this to a fallback location
    console.error('Failed to send log to DataDog:', error);
  }
}

/**
 * Create a logger function that sends logs to DataDog
 * @param logsApi - DataDog logs API client
 * @returns Logger function
 */
export function createDataDogLogger(logsApi: v2.LogsApi | null) {
  return {
    info: async (message: string, metadata?: Record<string, unknown>) => {
      await sendLogToDataDog(logsApi, message, DataDogLogLevel.INFO, metadata);
    },
    warn: async (message: string, metadata?: Record<string, unknown>) => {
      await sendLogToDataDog(logsApi, message, DataDogLogLevel.WARN, metadata);
    },
    error: async (message: string, metadata?: Record<string, unknown>) => {
      await sendLogToDataDog(logsApi, message, DataDogLogLevel.ERROR, metadata);
    },
  };
}
