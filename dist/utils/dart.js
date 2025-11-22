import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { execSync } from 'node:child_process';
export const COMMON_DART_CODEGEN_SUFFIXES = [
    '.g.dart',
    '.freezed.dart',
    '.gql.dart',
    '.fakes.dart',
    '.golden.dart',
];
export const TSU_PACKAGE_INDEX = 'PACKAGE_INDEX';
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
export function isDartPackage(cwd = process.cwd()) {
    return findDartPackageRoot(cwd) !== null;
}
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
export function resolveImportPath(fromFile, importPath, packageRoot) {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const fromDir = dirname(fromFile);
        return resolve(fromDir, importPath);
    }
    return resolve(packageRoot, importPath);
}
export function findAllDartFiles(rootDir = process.cwd()) {
    try {
        const output = execSync('find . -name "*.dart" -type f ' +
            '-not -path "*/.dart_tool/*" ' +
            '-not -path "*/build/*" ' +
            '-not -path "*/.symlinks/*" ' +
            '2>/dev/null', {
            cwd: rootDir,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        }).trim();
        if (!output) {
            return [];
        }
        return output
            .split('\n')
            .filter((file) => file.length > 0)
            .map((file) => resolve(rootDir, file));
    }
    catch {
        return null;
    }
}
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
export function buildReverseDependencyGraph(dependencyGraph) {
    const reverseGraph = new Map();
    for (const file of dependencyGraph.keys()) {
        if (!reverseGraph.has(file)) {
            reverseGraph.set(file, []);
        }
    }
    for (const [file, imports] of dependencyGraph.entries()) {
        for (const importedFile of imports) {
            if (!reverseGraph.has(importedFile)) {
                reverseGraph.set(importedFile, []);
            }
            reverseGraph.get(importedFile).push(file);
        }
    }
    return reverseGraph;
}
export function findDownstreamDependencies(targetFiles, reverseGraph) {
    const downstream = new Set();
    const queue = [...targetFiles];
    const visited = new Set(targetFiles);
    while (queue.length > 0) {
        const current = queue.shift();
        const dependents = reverseGraph.get(current) || [];
        for (const dependent of dependents) {
            if (!visited.has(dependent)) {
                visited.add(dependent);
                downstream.add(dependent);
                queue.push(dependent);
            }
        }
    }
    return downstream;
}
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
export function readPackageName(packageRoot) {
    const pubspecPath = join(packageRoot, 'pubspec.yaml');
    if (!existsSync(pubspecPath)) {
        return null;
    }
    try {
        const content = readFileSync(pubspecPath, 'utf-8');
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        if (nameMatch && nameMatch[1]) {
            return nameMatch[1].trim();
        }
        return null;
    }
    catch {
        return null;
    }
}
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
                if (relativePath === location ||
                    relativePath.startsWith(location + '/')) {
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
//# sourceMappingURL=dart.js.map