import { isVerbose } from './verbose-state.js';
import { loadDataDogConfig, initializeDataDogClient, createDataDogLogger, } from './datadog.js';
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
const dataDogConfig = loadDataDogConfig();
const dataDogClient = initializeDataDogClient(dataDogConfig);
const dataDogLogger = createDataDogLogger(dataDogClient);
export function log(message, level = LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}
export function logError(message) {
    log(message, LogLevel.ERROR);
    void dataDogLogger.error(message);
}
export function logWarn(message) {
    log(message, LogLevel.WARN);
    void dataDogLogger.warn(message);
}
export function logInfo(message) {
    log(message, LogLevel.INFO);
    void dataDogLogger.info(message);
}
export function logIfVerbose(verbose, message) {
    const shouldLog = verbose !== undefined ? verbose : isVerbose();
    if (shouldLog) {
        console.error(message);
    }
}
