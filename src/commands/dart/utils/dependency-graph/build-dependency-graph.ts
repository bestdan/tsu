import { existsSync } from 'node:fs';
import { extractImports } from '../imports/extract-imports.js';
import { resolveImportPath } from '../imports/resolve-import-path.js';

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
