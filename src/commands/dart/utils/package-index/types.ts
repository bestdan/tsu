/**
 * Name of the package index file used in mono-repos.
 * This file provides efficient package lookup in large mono-repos.
 */
export const TSU_PACKAGE_INDEX = 'PACKAGE_INDEX';

/**
 * Structure of a package entry in the TSU_PACKAGE_INDEX file.
 *
 * The TSU_PACKAGE_INDEX file is only relevant for mono-repos where you have multiple
 * Dart packages. It provides an efficient way to map files to their containing packages
 * without having to walk the directory tree. For single-package repos or when the file
 * is missing, the utilities will automatically fall back to searching for pubspec.yaml
 * files.
 */
export interface PackageIndexEntry {
  name: string;
  location: string;
  [key: string]: unknown; // Allow additional properties
}
