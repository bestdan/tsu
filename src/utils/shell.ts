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
