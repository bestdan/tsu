/**
 * Parses `git status --porcelain` output into a Map of file paths to their status codes.
 * Handles renames (` -> ` syntax) by keeping the destination path.
 */
export function parseGitStatusEntries(status: string): Map<string, string> {
  const entries = new Map<string, string>();

  status
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const match = line.match(/^(.{2})\s+(.+)$/);
      if (!match) {
        return;
      }

      const [, state, rawPath] = match;
      if (!state || !rawPath) return;
      const normalizedPath = rawPath.includes(' -> ')
        ? (rawPath.split(' -> ').pop() ?? rawPath)
        : rawPath;
      if (normalizedPath) {
        entries.set(normalizedPath, state);
      }
    });

  return entries;
}

/**
 * Compares two `git status --porcelain` snapshots and returns file paths
 * that are new or have a different status in the "after" snapshot.
 */
export function getNewlyChangedFiles(before: string, after: string): string[] {
  const beforeEntries = parseGitStatusEntries(before);
  const afterEntries = parseGitStatusEntries(after);

  return Array.from(afterEntries.entries())
    .filter(([path, state]) => beforeEntries.get(path) !== state)
    .map(([path]) => path);
}
