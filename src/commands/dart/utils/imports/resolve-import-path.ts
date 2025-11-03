import { dirname, resolve } from 'node:path';

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
