import { execSync } from 'node:child_process';

/**
 * Escapes a shell argument to prevent injection attacks.
 * Uses single-quote escaping which is safe for most shells.
 * @param arg - The argument to escape
 * @returns The escaped argument
 * @example
 * escapeShellArg("file's name.txt") // Returns: 'file'\''s name.txt'
 */
export function escapeShellArg(arg: string): string {
  // Replace single quotes with '\'' (end quote, escaped quote, start quote)
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

/**
 * Checks if a command is available in the system PATH.
 * @param command - The command name to check
 * @returns true if the command is installed, false otherwise
 * @example
 * isCommandInstalled('dcm') // Returns: true if DCM is installed
 */
/* v8 ignore next -- @preserve */
export function isCommandInstalled(command: string): boolean {
  try {
    execSync(`command -v ${escapeShellArg(command)}`, {
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}
