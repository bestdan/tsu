import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
import { parseNameStatus } from '../changed-files/changed-file-entry.js';
import type { ChangedFileEntry } from '../changed-files/changed-file-entry.js';

export interface GetFilesInRangeWithStatusOptions {
  /** The commit range to check (e.g., 'origin/main..HEAD', 'abc123..def456') */
  range: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Gets the files that changed in a commit range, each paired with its git
 * change status (added/modified/renamed/copied).
 *
 * Mirrors {@link getFilesInRange} but preserves the change type, which callers
 * need to decide whether a change can affect path-based ownership. Deletions
 * are excluded (`--diff-filter=ACMR`), matching {@link getFilesInRange}.
 *
 * @returns Array of changed file entries, or null if not in a git repo or on error
 */
export function getFilesInRangeWithStatus(
  options: GetFilesInRangeWithStatusOptions
): ChangedFileEntry[] | null {
  const { range, cwd = process.cwd() } = options;

  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);
    const command = `git diff --name-status --diff-filter=ACMR ${escapeShellArg(range)}`;

    const result = execSync(command, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return parseNameStatus(result);
  } catch {
    return null;
  }
}
