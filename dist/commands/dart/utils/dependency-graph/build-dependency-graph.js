import { existsSync } from 'node:fs';
import { extractImports } from '../imports/extract-imports.js';
import { resolveImportPath } from '../imports/resolve-import-path.js';
export function buildDependencyGraph(dartFiles, packageRoot) {
    const graph = new Map();
    for (const file of dartFiles) {
        const imports = extractImports(file, packageRoot);
        const resolvedImports = imports
            .map((imp) => resolveImportPath(file, imp, packageRoot))
            .filter((path) => existsSync(path));
        graph.set(file, resolvedImports);
    }
    return graph;
}
