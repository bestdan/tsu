import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
export function findFilePackageRoot(filePath, workspaceRoot) {
    let currentPath = dirname(filePath);
    const root = resolve('/');
    while (currentPath !== root && currentPath.startsWith(workspaceRoot)) {
        const pubspecPath = join(currentPath, 'pubspec.yaml');
        if (existsSync(pubspecPath)) {
            return currentPath;
        }
        currentPath = dirname(currentPath);
    }
    return workspaceRoot;
}
//# sourceMappingURL=find-file-package-root.js.map