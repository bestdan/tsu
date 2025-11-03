import { findDartPackageRoot } from './find-dart-package-root.js';

/**
 * Checks if the given directory is inside a Dart package.
 * @param cwd - The directory to check (defaults to current directory)
 * @returns true if inside a Dart package, false otherwise
 */
export function isDartPackage(cwd: string = process.cwd()): boolean {
  return findDartPackageRoot(cwd) !== null;
}
