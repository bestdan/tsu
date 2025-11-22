import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { findDartPackageRoot, findFilePackageRoot } from '../utils/dart.js';
export function dartPackage(filePath, options) {
    const absolutePath = resolve(filePath);
    if (!existsSync(absolutePath)) {
        if (options.verbose) {
            console.error(`✗ File not found: ${filePath}`);
        }
        process.exit(1);
    }
    const workspaceRoot = findDartPackageRoot(absolutePath);
    if (!workspaceRoot) {
        if (options.verbose) {
            console.error('✗ Not inside a Dart package');
        }
        process.exit(1);
    }
    const packageRoot = findFilePackageRoot(absolutePath, workspaceRoot);
    if (options.verbose) {
        console.error(`Package root for ${filePath}:`);
    }
    console.log(packageRoot);
    process.exit(0);
}
//# sourceMappingURL=dart-package.js.map