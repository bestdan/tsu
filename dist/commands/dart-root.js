import { findDartPackageRoot } from '../utils/dart.js';
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
        if (options.verbose) {
            console.error('✗ Not inside a Dart package');
        }
        process.exit(1);
    }
}
//# sourceMappingURL=dart-root.js.map