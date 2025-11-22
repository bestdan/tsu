export var LogLevel;
(function (LogLevel) {
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
export function log(message, level = LogLevel.INFO) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level}] ${message}`);
}
export function logError(message) {
    log(message, LogLevel.ERROR);
}
export function logWarn(message) {
    log(message, LogLevel.WARN);
}
export function logInfo(message) {
    log(message, LogLevel.INFO);
}
import { isVerbose } from './verbose-state.js';
export function logIfVerbose(verbose, message) {
    const shouldLog = verbose !== undefined ? verbose : isVerbose();
    if (shouldLog) {
        console.error(message);
    }
}
//# sourceMappingURL=logger.js.map