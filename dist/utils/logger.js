import { isVerbose } from './verbose-state.js';
import { loadDataDogConfig, initializeDataDogClient, createDataDogLogger, } from './datadog.js';
export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
let dataDogConfig = null;
let dataDogClient = null;
let dataDogLogger = null;
function getDataDogLogger() {
    if (dataDogLogger === null) {
        dataDogConfig = loadDataDogConfig();
        dataDogClient = initializeDataDogClient(dataDogConfig);
        dataDogLogger = createDataDogLogger(dataDogClient);
    }
    return dataDogLogger;
}
export function log(message, level = LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}
export function logError(message) {
    log(message, LogLevel.ERROR);
    void getDataDogLogger().error(message);
}
export function logWarn(message) {
    log(message, LogLevel.WARN);
    void getDataDogLogger().warn(message);
}
export function logInfo(message) {
    log(message, LogLevel.INFO);
    void getDataDogLogger().info(message);
}
export function logIfVerbose(verbose, message) {
    const shouldLog = verbose !== undefined ? verbose : isVerbose();
    if (shouldLog) {
        console.error(message);
    }
}
