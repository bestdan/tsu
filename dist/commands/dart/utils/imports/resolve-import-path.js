import { dirname, resolve } from 'node:path';
export function resolveImportPath(fromFile, importPath, packageRoot) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const fromDir = dirname(fromFile);
        return resolve(fromDir, importPath);
    }
    return resolve(packageRoot, importPath);
}
//# sourceMappingURL=resolve-import-path.js.map