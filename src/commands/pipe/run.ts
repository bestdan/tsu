import { execSync } from 'node:child_process';

export interface PipeRunOptions {
  verbose?: boolean;
}

/**
 * Runs a command, captures its exit code, and outputs the exit code to stdout.
 * This is designed to be the first command in a pipe chain.
 *
 * ```bash
 * tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format'
 * ```
 *
 * The command:
 * 1. Executes the given command with stdio inherited (so output is visible)
 * 2. Captures the exit code
 * 3. Outputs the exit code to stdout (for piping to next command)
 * 4. Exits with that exit code
 *
 * @param command - The command to execute
 * @param options - Options for the command
 */
export function pipeRun(
  command: string,
  options: PipeRunOptions = {}
): void {
  const verbose = options.verbose || false;

  if (verbose) {
    console.error(`Running: ${command}`);
  }

  let exitCode = 0;
  try {
    // Execute the command with stdio inherited so output is visible
    execSync(command, {
      stdio: 'inherit',
    });
    exitCode = 0;
  } catch (error) {
    // Command failed, capture exit code
    exitCode =
      error && typeof error === 'object' && 'status' in error
        ? (error.status as number)
        : 1;
  }

  // Output the exit code to stdout for the next pipe
  console.log(exitCode);

  // Exit with the exit code
  process.exit(exitCode);
}
