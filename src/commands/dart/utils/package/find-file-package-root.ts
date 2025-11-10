import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

/**
 * Finds the specific package root for a given file (the package it belongs to).
 * Useful in mono-repos where a file might be in a sub-package.
 * @param filePath - Absolute path to a Dart file
 * @param workspaceRoot - Root of the workspace to search within
 * @returns Path to the package containing the file
 */
export function findFilePackageRoot(filePath: string, workspaceRoot: string): string {
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
