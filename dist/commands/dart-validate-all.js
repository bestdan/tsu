import { dartValidateFormat } from './dart-validate-format.js';
import { dartValidateAnalysis } from './dart-validate-analysis.js';
import { dartValidateDcm } from './dart-validate-dcm.js';
import { dartValidateFreezed } from './dart-validate-freezed.js';
export function dartValidateAll(options = {}) {
    const verbose = options.verbose || false;
    if (verbose) {
        console.error('🚀 Running all Dart validation checks...');
        console.error('');
    }
    let hasErrors = false;
    if (!options.skipFormat) {
        try {
            dartValidateFormat({
                verbose,
                files: options.files,
                excludeSuffixes: options.excludeSuffixes,
            });
        }
        catch {
            hasErrors = true;
            if (verbose) {
                console.error('Format validation failed');
            }
        }
    }
    if (!options.skipAnalysis) {
        try {
            dartValidateAnalysis({
                verbose,
                files: options.files,
            });
        }
        catch {
            hasErrors = true;
            if (verbose) {
                console.error('Analysis validation failed');
            }
        }
    }
    if (!options.skipDcm) {
        try {
            dartValidateDcm({
                verbose,
                files: options.files,
            });
        }
        catch {
            hasErrors = true;
            if (verbose) {
                console.error('DCM validation failed');
            }
        }
    }
    if (!options.skipFreezed && options.files && options.files.length > 0) {
        try {
            dartValidateFreezed({
                verbose,
                files: options.files,
            });
        }
        catch {
            hasErrors = true;
            if (verbose) {
                console.error('Freezed validation failed');
            }
        }
    }
    if (hasErrors) {
        console.error('');
        console.error('❌ Some validation checks failed');
        process.exit(1);
    }
    if (verbose) {
        console.error('');
        console.error('✓ All validation checks passed');
    }
    process.exit(0);
}
//# sourceMappingURL=dart-validate-all.js.map