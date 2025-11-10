import { ensureCondition, ensureDCMInstalled } from '../../../utils/command-helpers.js';
import { isDartPackage } from '../utils/dart.js';
import { logIfVerbose } from '../../../utils/logger.js';
import { dcmAnalyze } from '../../../utils/dcm-parse.js';

export interface DartDcmAnalyzeOptions {
  verbose?: boolean;
  timeout?: number;
}

/**
 * Runs DCM analyze and outputs files with issues.
 *
 * This command:
 * 1. Checks if DCM is installed
 * 2. Verifies we're in a Dart package
 * 3. Runs dcm analyze on the entire package
 * 4. Outputs files with issues to stdout (one per line)
 * 5. Exits with error code if issues are found
 */
export function dartDcmAnalyze(options: DartDcmAnalyzeOptions = {}): void {
  const verbose = options.verbose || false;
  const timeout = options.timeout || 7000;

  ensureDCMInstalled(verbose);
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  logIfVerbose(verbose, '🔍 Running DCM analyze...');

  const cwd = process.cwd();
  const result = dcmAnalyze({ cwd, timeout });

  if (!result.success) {
    logIfVerbose(verbose, '❌ DCM analyze found issues\n');

    // Output files to stdout (one per line) for pipe-friendliness
    result.filesWithIssues.forEach((file) => {
      console.log(file);
    });

    process.exit(1);
  }

  logIfVerbose(verbose, '✓ All files pass DCM analyze checks');
  process.exit(0);
}
