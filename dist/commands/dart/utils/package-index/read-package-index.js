import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { TSU_PACKAGE_INDEX } from './types.js';
export function readPackageIndex(workspaceRoot = process.cwd()) {
    const packageIndexPath = resolve(workspaceRoot, TSU_PACKAGE_INDEX);
    if (!existsSync(packageIndexPath)) {
        return null;
    }
    try {
        const content = readFileSync(packageIndexPath, 'utf-8');
        const packages = JSON.parse(content);
        if (!Array.isArray(packages)) {
            return null;
        }
        return packages;
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=read-package-index.js.map