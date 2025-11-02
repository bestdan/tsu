import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { execSync } from 'node:child_process';

/**
 * Common Dart code generation file suffixes.
 * These files are typically auto-generated and should be excluded from formatting/linting checks.
 */
export const COMMON_DART_CODEGEN_SUFFIXES = [
  '.g.dart',
  '.freezed.dart',
  '.gql.dart',
  '.fakes.dart',
  '.golden.dart',
] as const;

/**
 * Finds the nearest pubspec.yaml file by walking up the directory tree.
 * @param startPath - Path to start searching from (defaults to current directory)
 * @returns Path to the directory containing pubspec.yaml, or null if not found
 */
export function findDartPackageRoot(
  startPath: string = process.cwd()
): string | null {
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

/**
 * Finds the specific package root for a given file (the package it belongs to).
 * Useful in mono-repos where a file might be in a sub-package.
 * @param filePath - Absolute path to a Dart file
 * @param workspaceRoot - Root of the workspace to search within
 * @returns Path to the package containing the file
 */
export function findFilePackageRoot(
  filePath: string,
  workspaceRoot: string
): string {
  let currentPath = dirname(filePath);
  const root = resolve('/');

  // Walk up until we find a pubspec.yaml
  while (currentPath !== root && currentPath.startsWith(workspaceRoot)) {
    const pubspecPath = join(currentPath, 'pubspec.yaml');
    if (existsSync(pubspecPath)) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }

  // Fallback to workspace root
  return workspaceRoot;
}

/**
 * Checks if the given directory is inside a Dart package.
 * @param cwd - The directory to check (defaults to current directory)
 * @returns true if inside a Dart package, false otherwise
 */
export function isDartPackage(cwd: string = process.cwd()): boolean {
  return findDartPackageRoot(cwd) !== null;
}

/**
 * Extracts import statements from a Dart file.
 * @param filePath - Path to the Dart file
 * @param packageRoot - Root directory of the Dart package
 * @returns Array of imported file paths (resolved where possible)
 */
export function extractImports(
  filePath: string,
  packageRoot: string
): string[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  // Match import statements: import 'path' or import "path"
  // Captures both single and double quotes
  const importRegex = /^\s*import\s+['"]([^'"]+)['"]/gm;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // match[1] could be undefined in theory, skip if so
    if (!importPath) {
      continue;
    }

    // Skip dart: imports (SDK imports)
    if (importPath.startsWith('dart:')) {
      continue;
    }

    // Handle package: imports
    if (importPath.startsWith('package:')) {
      // Extract package name and path: package:package_name/path/to/file.dart
      const packageMatch = importPath.match(/^package:([^/]+)\/(.+)$/);
      if (packageMatch && packageMatch[1] && packageMatch[2]) {
        const packageName = packageMatch[1];
        const packagePath = packageMatch[2];

        // In Dart, package imports map to lib/ directory
        // package:features/account/foo.dart -> features/lib/account/foo.dart

        // 1. Try subdirectory package with lib (like features/lib/)
        const subPackageWithLib = resolve(
          packageRoot,
          packageName,
          'lib',
          packagePath
        );
        if (existsSync(subPackageWithLib)) {
          imports.push(`${packageName}/lib/${packagePath}`);
          continue;
        }

        // 2. Try same package with lib/ (for local package)
        const localWithLib = resolve(packageRoot, 'lib', packagePath);
        if (existsSync(localWithLib)) {
          imports.push(`lib/${packagePath}`);
          continue;
        }

        // 3. Try without lib/ for non-standard packages
        const subPackagePath = resolve(packageRoot, packageName, packagePath);
        if (existsSync(subPackagePath)) {
          imports.push(`${packageName}/${packagePath}`);
          continue;
        }
      }
    } else {
      // Relative import
      imports.push(importPath);
    }
  }

  return imports;
}

/**
 * Resolves an import path to an absolute path.
 * @param fromFile - The file containing the import
 * @param importPath - The import path (relative or package-relative)
 * @param packageRoot - Root directory of the Dart package
 * @returns Absolute path to the imported file
 */
export function resolveImportPath(
  fromFile: string,
  importPath: string,
  packageRoot: string
): string {
  // If it starts with ./ or ../, it's a relative import
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const fromDir = dirname(fromFile);
    return resolve(fromDir, importPath);
  }

  // Otherwise, resolve from package root
  return resolve(packageRoot, importPath);
}

/**
 * Finds all Dart files in the project, excluding common build/cache directories.
 * @param rootDir - Root directory to search (defaults to current directory)
 * @returns Array of absolute paths to Dart files, or null on error
 */
export function findAllDartFiles(
  rootDir: string = process.cwd()
): string[] | null {
  try {
    // Find all .dart files, excluding common directories like .dart_tool, build, .symlinks
    const output = execSync(
      'find . -name "*.dart" -type f ' +
        '-not -path "*/.dart_tool/*" ' +
        '-not -path "*/build/*" ' +
        '-not -path "*/.symlinks/*" ' +
        '2>/dev/null',
      {
        cwd: rootDir,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large projects
      }
    ).trim();

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .filter((file) => file.length > 0)
      .map((file) => resolve(rootDir, file));
  } catch {
    return null;
  }
}

/**
 * Builds a dependency graph of which files import which files.
 * @param dartFiles - Array of Dart file paths to analyze
 * @param packageRoot - Root directory of the Dart package
 * @returns Map of file -> array of files that file imports
 */
export function buildDependencyGraph(
  dartFiles: string[],
  packageRoot: string
): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const file of dartFiles) {
    const imports = extractImports(file, packageRoot);
    const resolvedImports = imports
      .map((imp) => resolveImportPath(file, imp, packageRoot))
      .filter((path) => existsSync(path));

    graph.set(file, resolvedImports);
  }

  return graph;
}

/**
 * Builds a reverse dependency graph (which files depend on which).
 * @param dependencyGraph - Forward dependency graph
 * @returns Map of file -> array of files that import it
 */
export function buildReverseDependencyGraph(
  dependencyGraph: Map<string, string[]>
): Map<string, string[]> {
  const reverseGraph = new Map<string, string[]>();

  // Initialize all files in the reverse graph
  for (const file of dependencyGraph.keys()) {
    if (!reverseGraph.has(file)) {
      reverseGraph.set(file, []);
    }
  }

  // Build reverse edges
  for (const [file, imports] of dependencyGraph.entries()) {
    for (const importedFile of imports) {
      if (!reverseGraph.has(importedFile)) {
        reverseGraph.set(importedFile, []);
      }
      reverseGraph.get(importedFile)!.push(file);
    }
  }

  return reverseGraph;
}

/**
 * Finds all files that depend on the given files (downstream dependencies).
 * Uses breadth-first search to find all transitive dependencies.
 * @param targetFiles - Array of file paths to find dependents for
 * @param reverseGraph - Reverse dependency graph
 * @returns Set of all files that transitively depend on the target files
 */
export function findDownstreamDependencies(
  targetFiles: string[],
  reverseGraph: Map<string, string[]>
): Set<string> {
  const downstream = new Set<string>();
  const queue = [...targetFiles];
  const visited = new Set<string>(targetFiles);

  while (queue.length > 0) {
    const current = queue.shift()!;
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

/**
 * Structure of a package entry in PACKAGE_INDEX
 */
export interface PackageIndexEntry {
  name: string;
  location: string;
  [key: string]: unknown; // Allow additional properties
}

/**
 * Reads and parses PACKAGE_INDEX file from the workspace root.
 * @param workspaceRoot - Root directory of the workspace (defaults to current directory)
 * @returns Array of package entries, or null if file doesn't exist or is invalid
 */
export function readPackageIndex(
  workspaceRoot: string = process.cwd()
): PackageIndexEntry[] | null {
  const packageIndexPath = resolve(workspaceRoot, 'PACKAGE_INDEX');

  if (!existsSync(packageIndexPath)) {
    return null;
  }

  try {
    const content = readFileSync(packageIndexPath, 'utf-8');
    const packages = JSON.parse(content);

    if (!Array.isArray(packages)) {
      return null;
    }

    return packages as PackageIndexEntry[];
  } catch {
    return null;
  }
}

/**
 * Finds which package(s) contain the given files using PACKAGE_INDEX.
 * @param files - Array of file paths (relative or absolute)
 * @param workspaceRoot - Root directory of the workspace
 * @returns Map of package location to package name
 */
export function findAffectedPackages(
  files: string[],
  workspaceRoot: string = process.cwd()
): Map<string, string> {
  const packages = readPackageIndex(workspaceRoot);
  if (!packages) {
    return new Map();
  }

  // Sort packages by location length (longest first) to match most specific packages first
  const sortedPackages = [...packages].sort(
    (a, b) => b.location.length - a.location.length
  );

  const affectedPackages = new Map<string, string>();

  for (const file of files) {
    // Convert to relative path if absolute
    const relativePath = file.startsWith(workspaceRoot)
      ? file.substring(workspaceRoot.length + 1)
      : file;

    // Find the package that contains this file
    for (const pkg of sortedPackages) {
      const location = pkg.location;
      if (
        relativePath === location ||
        relativePath.startsWith(location + '/')
      ) {
        affectedPackages.set(location, pkg.name);
        break;
      }
    }
  }

  return affectedPackages;
}
