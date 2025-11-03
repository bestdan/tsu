export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/* v8 ignore next -- @preserve */
export function log(message: string, level: LogLevel = LogLevel.INFO): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

/* v8 ignore next -- @preserve */
export function logError(message: string): void {
  log(message, LogLevel.ERROR);
}

/* v8 ignore next -- @preserve */
export function logWarn(message: string): void {
  log(message, LogLevel.WARN);
}

/* v8 ignore next -- @preserve */
export function logInfo(message: string): void {
  log(message, LogLevel.INFO);
}

/**
 * Logs a message to stderr if verbose mode is enabled.
 * This is a helper to reduce repetitive verbose logging code.
 * @param verbose - Whether verbose mode is enabled
 * @param message - Message to log
 * @example
 * logIfVerbose(verbose, '✓ Operation completed');
 */
/* v8 ignore next -- @preserve */
export function logIfVerbose(verbose: boolean, message: string): void {
  if (verbose) {
    console.error(message);
  }
}
