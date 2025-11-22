import { isDartPackage } from './utils/dart.js';
export function dartCheck(path, options) {
    const cwd = path || process.cwd();
    const isPackage = isDartPackage(cwd);
    if (options.verbose) {
        if (isPackage) {
            console.error('✓ Inside a Dart package');
        }
        else {
            console.error('✗ Not inside a Dart package');
        }
    }
    process.exit(isPackage ? 0 : 1);
}
