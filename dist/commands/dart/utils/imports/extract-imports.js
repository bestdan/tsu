import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function extractImports(filePath, packageRoot) {
    if (!existsSync(filePath)) {
        return [];
    }
    const content = readFileSync(filePath, 'utf-8');
    const imports = [];
    const importRegex = /^\s*import\s+['"]([^'"]+)['"]/gm;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        if (!importPath) {
            continue;
        }
        if (importPath.startsWith('dart:')) {
            continue;
        }
        if (importPath.startsWith('package:')) {
            const packageMatch = importPath.match(/^package:([^/]+)\/(.+)$/);
            if (packageMatch && packageMatch[1] && packageMatch[2]) {
                const packageName = packageMatch[1];
                const packagePath = packageMatch[2];
                const subPackageWithLib = resolve(packageRoot, packageName, 'lib', packagePath);
                if (existsSync(subPackageWithLib)) {
                    imports.push(`${packageName}/lib/${packagePath}`);
                    continue;
                }
                const localWithLib = resolve(packageRoot, 'lib', packagePath);
                if (existsSync(localWithLib)) {
                    imports.push(`lib/${packagePath}`);
                    continue;
                }
                const subPackagePath = resolve(packageRoot, packageName, packagePath);
                if (existsSync(subPackagePath)) {
                    imports.push(`${packageName}/${packagePath}`);
                    continue;
                }
            }
        }
        else {
            imports.push(importPath);
        }
    }
    return imports;
}
//# sourceMappingURL=extract-imports.js.map