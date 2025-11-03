import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { TSU_PACKAGE_INDEX, type PackageIndexEntry } from './types.js';

/**
 * Reads and parses the TSU_PACKAGE_INDEX file from the workspace root.
 *
 * The TSU_PACKAGE_INDEX file is optional and only relevant for large mono-repos with
 * multiple Dart packages. It provides efficient package lookup by maintaining a JSON
 * index of all packages. If the file doesn't exist, the dart utilities will automatically
 * fall back to walking the directory tree to find pubspec.yaml files.
 *
 * @param workspaceRoot - Root directory of the workspace (defaults to current directory)
 * @returns Array of package entries, or null if file doesn't exist or is invalid
 */
export function readPackageIndex(
  workspaceRoot: string = process.cwd()
): PackageIndexEntry[] | null {
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

    return packages as PackageIndexEntry[];
  } catch {
    return null;
  }
}
