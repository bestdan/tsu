import { execSync } from 'node:child_process';

export interface PipeCheckOptions {
  verbose?: boolean;
}

/**
 * Wraps a command execution and displays success/failure with a label.
 * Exits with the same code as the wrapped command.
 *
 * @param command - The command to execute
 * @param label - Label to display in the output (e.g., 'format', 'analysis')
 * @param options - Options for the command
 *
 * @example
 * ```bash
 * tsu pipe check 'tsu hook format check' 'format'
 * # Output: ✅ format passed
 * ```
 *
 * @example
 * ```bash
 * tsu pipe check 'tsu hook analysis check' 'analysis'
 * # Output: ❌ analysis failed (exit code: 1)
 * ```
 */
export function pipeCheck(command: string, label: string, options: PipeCheckOptions = {}): void {
  const verbose = options.verbose || false;

  if (verbose) {
    console.error(`Running: ${command}`);
  }

  try {
    // Execute the command and capture output
    execSync(command, {
      stdio: 'inherit', // Pass through stdio so command output is visible
    });

    // If we get here, command succeeded
    console.log(`✅ ${label} passed`);
    process.exit(0);
  } catch (error) {
    // Command failed
    const exitCode =
      error && typeof error === 'object' && 'status' in error ? (error.status as number) : 1;

    console.log(`❌ ${label} failed`);

    if (verbose) {
      console.error(`Exit code: ${exitCode}`);
    }

    process.exit(exitCode);
  }
}
