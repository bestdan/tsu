import { isVerbose } from './verbose-state.js';
import { loadDataDogConfig, initializeDataDogClient, createDataDogLogger } from './datadog.js';

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Initialize DataDog client once on module load
const dataDogConfig = loadDataDogConfig();
const dataDogClient = initializeDataDogClient(dataDogConfig);
const dataDogLogger = createDataDogLogger(dataDogClient);

/* v8 ignore next -- @preserve */
export function log(message: string, level: LogLevel = LogLevel.INFO): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

/* v8 ignore next -- @preserve */
export function logError(message: string): void {
  log(message, LogLevel.ERROR);
  // Send to DataDog asynchronously without blocking
  void dataDogLogger.error(message);
}

/* v8 ignore next -- @preserve */
export function logWarn(message: string): void {
  log(message, LogLevel.WARN);
  // Send to DataDog asynchronously without blocking
  void dataDogLogger.warn(message);
}

/* v8 ignore next -- @preserve */
export function logInfo(message: string): void {
  log(message, LogLevel.INFO);
  // Send to DataDog asynchronously without blocking
  void dataDogLogger.info(message);
}

/**
 * Logs a message to stderr if verbose mode is enabled.
 * This is a helper to reduce repetitive verbose logging code.
 * If verbose parameter is provided, it takes precedence over global state.
 * Otherwise, uses the global verbose state.
 * @param verbose - Whether verbose mode is enabled (optional, uses global state if not provided)
 * @param message - Message to log
 * @example
 * logIfVerbose(verbose, '✓ Operation completed');
 * logIfVerbose(true, '✓ Always show this');
 * logIfVerbose(undefined, '✓ Show if global verbose is enabled');
 */
/* v8 ignore next -- @preserve */
export function logIfVerbose(verbose: boolean | undefined, message: string): void {
  const shouldLog = verbose !== undefined ? verbose : isVerbose();
  if (shouldLog) {
    console.error(message);
  }
}
