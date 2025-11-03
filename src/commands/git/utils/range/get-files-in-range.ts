import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';

export interface GetFilesInRangeOptions {
  /** The commit range to check (e.g., 'origin/main..HEAD', 'abc123..def456') */
  range: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
  /** Filter files by extension or pattern. Defaults to all files. */
  filter?: (file: string) => boolean;
}

/**
 * Gets the list of files that changed in a specific commit range.
 * This is useful for pre-push hooks to check only files being pushed.
 * @param options - Configuration options
 * @returns Array of file paths, or null if not in a git repo or on error
 */
export function getFilesInRange(
  options: GetFilesInRangeOptions
): string[] | null {
  const { range, cwd = process.cwd(), filter } = options;

  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);

    // Use git diff with --name-only and --diff-filter=ACMR to get only added/modified/renamed files
    const command = `git diff --name-only --diff-filter=ACMR ${escapeShellArg(range)}`;

    const result = execSync(command, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Split by newlines and filter out empty strings
    const files = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Apply optional filter
    return filter ? files.filter(filter) : files;
  } catch {
    return null;
  }
}
