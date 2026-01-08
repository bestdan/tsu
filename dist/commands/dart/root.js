import { findDartPackageRoot } from './utils/dart.js';
import { logError } from '../../utils/error-logger.js';
export function dartRoot(path, options) {
    const cwd = path || process.cwd();
    const root = findDartPackageRoot(cwd);
    if (options.verbose) {
        console.error('Dart package root:');
    }
    if (root) {
        console.log(root);
        process.exit(0);
    }
    else {
        const error = new Error('Not inside a Dart package');
        logError(error, `tsu dart root${path ? ` ${path}` : ''}`);
        if (options.verbose) {
            console.error('✗ Not inside a Dart package');
        }
        process.exit(1);
    }
}
