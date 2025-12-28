import { loadDataDogConfig, initializeDataDogClient, sendLogToDataDog, DataDogLogLevel, } from '../../utils/datadog.js';
import { logIfVerbose } from '../../utils/logger.js';
export async function dataDogCheck(options = {}) {
    const { verbose } = options;
    logIfVerbose(verbose, 'Checking DataDog configuration...');
    const config = loadDataDogConfig();
    if (!config.enabled) {
        console.error('Error: DataDog is not configured');
        console.error('DD_API_KEY environment variable is not set');
        console.error('\nRun "tsu datadog setup" to configure DataDog');
        process.exit(1);
    }
    logIfVerbose(verbose, `DataDog site: ${config.site}`);
    const logsApi = initializeDataDogClient(config);
    if (!logsApi) {
        console.error('Error: Failed to initialize DataDog client');
        process.exit(1);
    }
    logIfVerbose(verbose, 'Sending test log to DataDog...');
    try {
        await sendLogToDataDog(logsApi, 'DataDog connection test from tsutils', DataDogLogLevel.INFO, {
            test: true,
            timestamp: new Date().toISOString(),
            command: 'datadog check',
        });
        logIfVerbose(verbose, 'Test log sent successfully');
        console.log('success');
        console.error('\n✅ DataDog connection successful!');
        console.error('Test log has been sent to DataDog.');
        console.error(`Check your logs at: https://app.${config.site}/logs`);
    }
    catch (error) {
        console.error('Error: Failed to send test log to DataDog');
        if (error instanceof Error) {
            console.error(error.message);
        }
        console.error('\nPossible issues:');
        console.error('- Invalid API key');
        console.error('- Incorrect DataDog site');
        console.error('- Network connectivity issues');
        process.exit(1);
    }
}
