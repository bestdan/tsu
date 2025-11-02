export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

export function log(message: string, level: LogLevel = LogLevel.INFO): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [${level}] ${message}`);
}

export function logError(message: string): void {
  log(message, LogLevel.ERROR);
}

export function logWarn(message: string): void {
  log(message, LogLevel.WARN);
}

export function logInfo(message: string): void {
  log(message, LogLevel.INFO);
}
