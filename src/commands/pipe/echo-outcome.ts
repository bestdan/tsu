import * as fs from 'node:fs';

export interface PipeEchoOutcomeOptions {
  verbose?: boolean;
}

/**
 * Reads exit code from stdin, displays outcome message with label,
 * and propagates the exit code through the pipe.
 *
 * This command is designed to work in a pipe chain:
 * ```bash
 * tsu hook format check | tsu pipe echoOutcome 'format'
 * ```
 *
 * The command:
 * 1. Reads the exit code from stdin (output from previous pipe command)
 * 2. Displays ✅ {label} passed or ❌ {label} failed to stderr
 * 3. Outputs the exit code to stdout for the next pipe
 * 4. Exits with that exit code
 *
 * @param label - Label to display (e.g., 'format', 'analysis')
 * @param options - Options for the command
 */
export function pipeEchoOutcome(
  label: string,
  options: PipeEchoOutcomeOptions = {}
): void {
  const verbose = options.verbose || false;

  // Read exit code from stdin
  let input = '';
  try {
    input = fs.readFileSync(0, 'utf-8').trim();
  } catch {
    // If we can't read from stdin, assume success
    input = '0';
  }

  // Parse the exit code from input
  const exitCode = parseInt(input, 10);
  if (isNaN(exitCode)) {
    console.error('Error: Invalid exit code received from stdin');
    process.exit(1);
  }

  // Display the outcome to stderr (so it doesn't interfere with pipe)
  if (exitCode === 0) {
    console.error(`✅ ${label} passed`);
  } else {
    console.error(`❌ ${label} failed`);
    if (verbose) {
      console.error(`Exit code: ${exitCode}`);
    }
  }

  // Output the exit code to stdout for the next pipe
  console.log(exitCode);

  // Exit with the exit code
  process.exit(exitCode);
}
