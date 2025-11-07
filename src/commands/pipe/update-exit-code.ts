import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface PipeUpdateExitCodeOptions {
  verbose?: boolean;
  reset?: boolean;
}

/**
 * Reads exit code from stdin, accumulates failures in a temp file,
 * and outputs the accumulated exit code.
 *
 * This command is designed to work in a pipe chain to track failures across multiple checks:
 * ```bash
 * tsu hook format check | tsu pipe echoOutcome 'format' | tsu pipe updateExitCode
 * tsu hook analysis check | tsu pipe echoOutcome 'analysis' | tsu pipe updateExitCode
 * tsu pipe updateExitCode --reset  # Reset the accumulated exit code
 * ```
 *
 * The command:
 * 1. Reads the exit code from stdin (output from previous pipe command)
 * 2. Reads the accumulated exit code from a temp file
 * 3. If either is non-zero, the accumulated code becomes 1
 * 4. Writes the accumulated exit code back to the temp file
 * 5. Outputs the accumulated exit code to stdout
 * 6. Exits with the accumulated exit code
 *
 * @param options - Options for the command
 */
export function pipeUpdateExitCode(
  options: PipeUpdateExitCodeOptions = {}
): void {
  const verbose = options.verbose || false;
  const reset = options.reset || false;

  const exitCodeFile = path.join(os.tmpdir(), 'tsu-pipe-accumulated-exit-code');

  if (reset) {
    // Reset the accumulated exit code
    if (fs.existsSync(exitCodeFile)) {
      fs.unlinkSync(exitCodeFile);
    }
    if (verbose) {
      console.error('Reset accumulated exit code');
    }
    console.log(0);
    process.exit(0);
  }

  // Read exit code from stdin
  let currentExitCode = 0;
  try {
    const input = fs.readFileSync(0, 'utf-8').trim();
    currentExitCode = parseInt(input, 10);
    if (isNaN(currentExitCode)) {
      currentExitCode = 0;
    }
  } catch {
    // If we can't read from stdin, assume success
    currentExitCode = 0;
  }

  // Read accumulated exit code from file
  let accumulatedExitCode = 0;
  if (fs.existsSync(exitCodeFile)) {
    try {
      const fileContent = fs.readFileSync(exitCodeFile, 'utf-8').trim();
      accumulatedExitCode = parseInt(fileContent, 10);
      if (isNaN(accumulatedExitCode)) {
        accumulatedExitCode = 0;
      }
    } catch {
      accumulatedExitCode = 0;
    }
  }

  // Update accumulated exit code: if either is non-zero, result is 1
  if (currentExitCode !== 0 || accumulatedExitCode !== 0) {
    accumulatedExitCode = 1;
  }

  // Write accumulated exit code to file
  fs.writeFileSync(exitCodeFile, accumulatedExitCode.toString(), 'utf-8');

  if (verbose) {
    console.error(`Accumulated exit code: ${accumulatedExitCode}`);
  }

  // Output the accumulated exit code to stdout
  console.log(accumulatedExitCode);

  // Exit with the accumulated exit code
  process.exit(accumulatedExitCode);
}
