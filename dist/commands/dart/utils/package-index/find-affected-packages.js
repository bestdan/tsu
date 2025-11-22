import { resolve } from 'node:path';
import { readPackageIndex } from './read-package-index.js';
import { readPackageName } from './read-package-name.js';
import { findFilePackageRoot } from '../package/find-file-package-root.js';
export function findAffectedPackages(files, workspaceRoot = process.cwd()) {
    const packages = readPackageIndex(workspaceRoot);
    if (packages) {
        const sortedPackages = [...packages].sort((a, b) => b.location.length - a.location.length);
        const affectedPackages = new Map();
        for (const file of files) {
            const relativePath = file.startsWith(workspaceRoot)
                ? file.substring(workspaceRoot.length + 1)
                : file;
            for (const pkg of sortedPackages) {
                const location = pkg.location;
                if (relativePath === location || relativePath.startsWith(location + '/')) {
                    affectedPackages.set(location, pkg.name);
                    break;
                }
            }
        }
        return affectedPackages;
    }
    const affectedPackages = new Map();
    for (const file of files) {
        const absolutePath = resolve(workspaceRoot, file);
        const packageRoot = findFilePackageRoot(absolutePath, workspaceRoot);
        if (packageRoot) {
            let location;
            if (packageRoot === workspaceRoot) {
                location = '.';
            }
            else if (packageRoot.startsWith(workspaceRoot + '/')) {
                location = packageRoot.substring(workspaceRoot.length + 1);
            }
            else {
                location = packageRoot;
            }
            const packageName = readPackageName(packageRoot);
            if (packageName) {
                affectedPackages.set(location, packageName);
            }
        }
    }
    return affectedPackages;
}
