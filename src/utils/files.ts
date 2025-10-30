/**
 * Filters out files that match any of the specified suffix patterns.
 * Useful for excluding generated files like .gql.dart, .g.dart, etc.
 *
 * @param files - Array of file paths to filter
 * @param suffixPatterns - Array of suffix patterns to exclude (e.g., ['.g.dart', '.gql.dart'])
 * @returns Array of file paths that don't match any of the suffix patterns
 *
 * @example
 * const files = ['lib/user.dart', 'lib/user.g.dart', 'lib/query.gql.dart'];
 * const filtered = filterFilesBySuffix(files, ['.g.dart', '.gql.dart']);
 * // Returns: ['lib/user.dart']
 */
export function filterFilesBySuffix(
  files: string[],
  suffixPatterns: string[]
): string[] {
  if (suffixPatterns.length === 0) {
    return files;
  }

  return files.filter((file) => {
    return !suffixPatterns.some((pattern) => file.endsWith(pattern));
  });
}
