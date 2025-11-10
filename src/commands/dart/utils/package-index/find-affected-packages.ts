import { resolve } from 'node:path';
import { readPackageIndex } from './read-package-index.js';
import { readPackageName } from './read-package-name.js';
import { findFilePackageRoot } from '../package/find-file-package-root.js';

/**
 * Finds which package(s) contain the given files.
 *
 * For mono-repos: If TSU_PACKAGE_INDEX exists, uses it for efficient lookup.
 * For single-package repos or when TSU_PACKAGE_INDEX is missing: Falls back to
 * walking up the directory tree to find pubspec.yaml files.
 *
 * @param files - Array of file paths (relative or absolute)
 * @param workspaceRoot - Root directory of the workspace
 * @returns Map of package location to package name
 */
export function findAffectedPackages(
  files: string[],
  workspaceRoot: string = process.cwd()
): Map<string, string> {
  const packages = readPackageIndex(workspaceRoot);

  // If PACKAGE_INDEX exists, use it for efficient lookup
  if (packages) {
    // Sort packages by location length (longest first) to match most specific packages first
    const sortedPackages = [...packages].sort((a, b) => b.location.length - a.location.length);

    const affectedPackages = new Map<string, string>();

    for (const file of files) {
      // Convert to relative path if absolute
      const relativePath = file.startsWith(workspaceRoot)
        ? file.substring(workspaceRoot.length + 1)
        : file;

      // Find the package that contains this file
      for (const pkg of sortedPackages) {
        const location = pkg.location;
        if (relativePath === location || relativePath.startsWith(location + '/')) {
          affectedPackages.set(location, pkg.name);
          break;
        }
      }
    }

    return affectedPackages;
  }

  // Fall back to finding packages by pubspec.yaml
  const affectedPackages = new Map<string, string>();

  for (const file of files) {
    const absolutePath = resolve(workspaceRoot, file);
    const packageRoot = findFilePackageRoot(absolutePath, workspaceRoot);

    if (packageRoot) {
      // Convert to relative path for consistency with PACKAGE_INDEX format
      let location: string;
      if (packageRoot === workspaceRoot) {
        // Package is at workspace root, use "." as location
        location = '.';
      } else if (packageRoot.startsWith(workspaceRoot + '/')) {
        // Package is a subdirectory, use relative path
        location = packageRoot.substring(workspaceRoot.length + 1);
      } else {
        // Package is outside workspace, use absolute path
        location = packageRoot;
      }

      // Get package name from pubspec.yaml
      const packageName = readPackageName(packageRoot);
      if (packageName) {
        affectedPackages.set(location, packageName);
      }
    }
  }

  return affectedPackages;
}
