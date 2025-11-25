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
 * Validates that a string contains only safe characters for use in shell commands.
 * This is an additional safety check beyond escaping.
 * @param input - The input to validate
 * @returns true if the input is safe, false otherwise
 * @example
 * isSafeShellInput('myfile.txt') // Returns: true
 * isSafeShellInput('file; rm -rf /') // Returns: false
 */
export function isSafeShellInput(input: string): boolean {
  // Allow alphanumeric, dots, dashes, underscores, slashes, and spaces
  // Explicitly reject: quotes (' "), backticks (`), dollar signs ($), semicolons (;),
  // pipes (|), ampersands (&), redirects (< >), wildcards (* ?), and other shell metacharacters
  const safePattern = /^[a-zA-Z0-9._\-/\s]+$/;
  return safePattern.test(input);
}

/**
 * Validates and escapes a shell argument.
 * Throws an error if the input contains potentially dangerous characters.
 * @param arg - The argument to validate and escape
 * @param allowUnsafe - If true, skip validation and only escape (default: false)
 * @returns The escaped argument
 * @throws Error if the argument contains unsafe characters and allowUnsafe is false
 * @example
 * safeShellArg("file.txt") // Returns: 'file.txt'
 * safeShellArg("file; rm -rf /") // Throws error
 * safeShellArg("file; rm -rf /", true) // Returns: 'file; rm -rf /' (escaped, not recommended)
 */
export function safeShellArg(arg: string, allowUnsafe = false): string {
  if (!allowUnsafe && !isSafeShellInput(arg)) {
    throw new Error(
      `Unsafe shell argument detected: "${arg}". Contains potentially dangerous characters.`
    );
  }
  return escapeShellArg(arg);
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
