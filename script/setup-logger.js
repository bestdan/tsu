#!/usr/bin/env node

/**
 * Setup script logger - logs setup events to console and DataDog
 * This is used by script/setup.sh to log errors and warnings during setup
 *
 * Usage:
 *   ./script/setup-logger.js info "Setup started"
 *   ./script/setup-logger.js warn "Warning message"
 *   ./script/setup-logger.js error "Error message"
 */

import { logInfo, logWarn, logError } from '../dist/utils/logger.js';

const [, , level, message] = process.argv;

if (!level || !message) {
  console.error('Usage: setup-logger.js <level> <message>');
  console.error('  level: info, warn, or error');
  process.exit(1);
}

/* v8 ignore next -- @preserve */
async function main() {
  switch (level.toLowerCase()) {
    case 'info':
      logInfo(message);
      break;
    case 'warn':
      logWarn(message);
      break;
    case 'error':
      logError(message);
      break;
    default:
      console.error(`Invalid log level: ${level}`);
      process.exit(1);
  }

  // Give async operations a brief moment to complete
  // This is a reasonable timeout for network requests to be queued
  await new Promise((resolve) => setTimeout(resolve, 100));
}

main().catch((error) => {
  console.error('Failed to log message:', error);
  process.exit(1);
});
