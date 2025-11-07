import { execSync } from 'node:child_process';

export interface PipeSeriesOptions {
  verbose?: boolean;
}

export interface CheckCommand {
  command: string;
  label: string;
}

/**
 * Runs multiple checks in series and returns failure if any check fails.
 * All checks are run even if some fail, and the final exit code is 1 if any failed.
 *
 * @param checks - Array of {command, label} objects to run
 * @param options - Options for the command
 *
 * @example
 * ```typescript
 * pipeSeriesFromArgs([
 *   'tsu hook format check', 'format',
 *   'tsu hook analysis check', 'analysis',
 *   'tsu hook dcm check', 'dcm'
 * ]);
 * ```
 */
export function pipeSeries(
  checks: CheckCommand[],
  options: PipeSeriesOptions = {}
): void {
  const verbose = options.verbose || false;
  let anyFailed = false;

  for (const check of checks) {
    if (verbose) {
      console.error(`\nRunning: ${check.command}`);
    }

    try {
      execSync(check.command, {
        stdio: 'inherit',
      });

      console.log(`✅ ${check.label} passed`);
    } catch (error) {
      anyFailed = true;
      const exitCode =
        error && typeof error === 'object' && 'status' in error
          ? (error.status as number)
          : 1;

      console.log(`❌ ${check.label} failed`);

      if (verbose) {
        console.error(`Exit code: ${exitCode}`);
      }
    }
  }

  if (anyFailed) {
    if (verbose) {
      console.error('\n❌ Some checks failed');
    }
    process.exit(1);
  }

  if (verbose) {
    console.error('\n✅ All checks passed');
  }
  process.exit(0);
}

/**
 * Helper to parse command-line arguments into CheckCommand array.
 * Arguments should be pairs of [command, label, command, label, ...]
 *
 * @param args - Flat array of [command, label, command, label, ...]
 * @returns Array of CheckCommand objects
 */
export function pipeSeriesFromArgs(args: string[]): CheckCommand[] {
  if (args.length % 2 !== 0) {
    console.error('Error: Arguments must be pairs of [command, label]');
    console.error('Usage: tsu pipe series <command1> <label1> <command2> <label2> ...');
    process.exit(1);
  }

  const checks: CheckCommand[] = [];
  for (let i = 0; i < args.length; i += 2) {
    checks.push({
      command: args[i] as string,
      label: args[i + 1] as string,
    });
  }

  return checks;
}
