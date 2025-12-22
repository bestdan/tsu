import { client, v2 } from '@datadog/datadog-api-client';
export function loadDataDogConfig() {
    return {
        apiKey: process.env.DD_API_KEY,
        site: process.env.DD_SITE || 'datadoghq.com',
        enabled: !!process.env.DD_API_KEY,
    };
}
export function initializeDataDogClient(config) {
    if (!config.enabled || !config.apiKey) {
        return null;
    }
    const configuration = client.createConfiguration({
        authMethods: {
            apiKeyAuth: config.apiKey,
        },
    });
    configuration.setServerVariables({
        site: config.site || 'datadoghq.com',
    });
    return new v2.LogsApi(configuration);
}
export var DataDogLogLevel;
(function (DataDogLogLevel) {
    DataDogLogLevel["INFO"] = "info";
    DataDogLogLevel["WARN"] = "warn";
    DataDogLogLevel["ERROR"] = "error";
})(DataDogLogLevel || (DataDogLogLevel = {}));
export async function sendLogToDataDog(logsApi, message, level = DataDogLogLevel.INFO, metadata) {
    if (!logsApi) {
        return;
    }
    try {
        const logEntry = {
            ddsource: 'tsutils',
            ddtags: `env:${process.env.NODE_ENV || 'development'},level:${level}`,
            message,
            service: 'tsutils',
            ...metadata,
        };
        await logsApi.submitLog({
            body: [logEntry],
        });
    }
    catch (error) {
        console.error('Failed to send log to DataDog:', error);
    }
}
export function createDataDogLogger(logsApi) {
    return {
        info: async (message, metadata) => {
            await sendLogToDataDog(logsApi, message, DataDogLogLevel.INFO, metadata);
        },
        warn: async (message, metadata) => {
            await sendLogToDataDog(logsApi, message, DataDogLogLevel.WARN, metadata);
        },
        error: async (message, metadata) => {
            await sendLogToDataDog(logsApi, message, DataDogLogLevel.ERROR, metadata);
        },
    };
}
