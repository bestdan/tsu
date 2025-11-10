/**
 * Global verbose state management for command execution.
 * This allows verbose mode to be set once at the command entry point
 * and accessed by any downstream utility function without explicit parameter passing.
 */

let verboseMode = false;

/**
 * Sets the global verbose mode state.
 * Should be called at the command entry point before executing command logic.
 * @param enabled - Whether verbose mode should be enabled
 * @example
 * setVerbose(options.verbose || false);
 */
export function setVerbose(enabled: boolean): void {
  verboseMode = enabled;
}

/**
 * Gets the current global verbose mode state.
 * @returns true if verbose mode is enabled, false otherwise
 * @example
 * if (isVerbose()) {
 *   console.error('Verbose message');
 * }
 */
export function isVerbose(): boolean {
  return verboseMode;
}

/**
 * Resets the verbose mode to false.
 * Useful for testing to ensure clean state between tests.
 * @example
 * resetVerbose(); // in test teardown
 */
export function resetVerbose(): void {
  verboseMode = false;
}
