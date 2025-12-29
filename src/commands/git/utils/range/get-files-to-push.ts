import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
import { getCurrentBranch } from '../repo/get-current-branch.js';
import { getFilesInRange } from './get-files-in-range.js';

export interface GetFilesToPushOptions {
  /** The directory to check. Defaults to process.cwd() */
  cwd?: string;
  /** Base branch to compare against when remote doesn't exist. Defaults to 'main' */
  baseBranch?: string;
}

/**
 * Gets the list of files that have changed uniquely in the current branch.
 * Uses three-dot diff against the base branch to show only files modified in the current branch,
 * excluding files that came from merge commits (e.g., when merging main into a feature branch).
 *
 * This is specifically designed for pre-push hooks and linting tools where you want to check
 * only the files you've actually modified, not files that were merged in from other branches.
 *
 * @param options - Configuration options or just the cwd string (for backwards compatibility)
 * @returns Array of file paths unique to the current branch, or null if not in a git repo
 *
 * @example
 * // On feature branch that merged main:
 * // - feature.txt (your change)
 * // - main1.txt, main2.txt (merged from main)
 * // Result: ['feature.txt'] - only your changes
 */
export function getFilesToPush(options: GetFilesToPushOptions | string = {}): string[] | null {
  // Support legacy string parameter for backwards compatibility
  const { cwd = process.cwd(), baseBranch = 'main' } =
    typeof options === 'string' ? { cwd: options } : options;
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);

    // Get current branch name
    const currentBranch = getCurrentBranch(resolvedCwd);

    if (!currentBranch) {
      return null;
    }

    // Check if we're on the base branch
    if (currentBranch === baseBranch) {
      // On base branch, return empty array (no files to check)
      return [];
    }

    // Verify base branch exists
    try {
      execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
        cwd: resolvedCwd,
        stdio: 'pipe',
      });
    } catch {
      // Base branch doesn't exist, return empty array
      return [];
    }

    // Use three-dot range to compare against base branch
    // This finds the merge base and shows only changes unique to HEAD
    // Handles merge commits elegantly by excluding merged files
    const range = `${baseBranch}...HEAD`;

    // Get files in the determined range
    return getFilesInRange({ range, cwd: resolvedCwd });
  } catch {
    return null;
  }
}
