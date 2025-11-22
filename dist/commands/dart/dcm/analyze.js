import { ensureCondition, ensureDCMInstalled } from '../../../utils/command-helpers.js';
import { isDartPackage } from '../utils/dart.js';
import { logIfVerbose } from '../../../utils/logger.js';
import { dcmAnalyze } from '../../../utils/dcm-parse.js';
export function dartDcmAnalyze(options = {}) {
    const verbose = options.verbose || false;
    const timeout = options.timeout || 7000;
    ensureDCMInstalled(verbose);
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    logIfVerbose(verbose, '🔍 Running DCM analyze...');
    const cwd = process.cwd();
    const result = dcmAnalyze({ cwd, timeout });
    if (!result.success) {
        logIfVerbose(verbose, '❌ DCM analyze found issues\n');
        result.filesWithIssues.forEach((file) => {
            console.log(file);
        });
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ All files pass DCM analyze checks');
    process.exit(0);
}
//# sourceMappingURL=analyze.js.map