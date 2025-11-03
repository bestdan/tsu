import { existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';

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
