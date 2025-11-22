import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
export function findDartPackageRoot(startPath = process.cwd()) {
    let currentPath = resolve(startPath);
    const root = resolve('/');
    while (currentPath !== root) {
        const pubspecPath = join(currentPath, 'pubspec.yaml');
        if (existsSync(pubspecPath)) {
            return currentPath;
        }
        currentPath = dirname(currentPath);
    }
    return null;
}
//# sourceMappingURL=find-dart-package-root.js.map