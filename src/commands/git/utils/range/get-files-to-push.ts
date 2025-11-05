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
 * Gets the list of files in commits that would be pushed to upstream.
 * Compares HEAD against the remote tracking branch (e.g., origin/feature-branch).
 * If the remote branch doesn't exist (never pushed before), compares against base branch.
 * Equivalent to: git diff --name-only origin/$(git branch --show-current)..HEAD
 * @param options - Configuration options or just the cwd string (for backwards compatibility)
 * @returns Array of file paths, or null if not in a git repo
 */
export function getFilesToPush(
  options: GetFilesToPushOptions | string = {}
): string[] | null {
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

    // Construct the remote tracking branch (e.g., origin/feature-branch)
    const remoteBranch = `origin/${currentBranch}`;

    // Check if the remote branch exists
    let range: string;
    try {
      execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
        cwd: resolvedCwd,
        stdio: 'pipe',
      });
      // Remote branch exists, compare against it
      range = `${remoteBranch}..HEAD`;
    } catch {
      // Remote branch doesn't exist (never pushed before)
      // Fall back to comparing against base branch
      try {
        execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
          cwd: resolvedCwd,
          stdio: 'pipe',
        });
      } catch {
        // Base branch doesn't exist either, return empty array
        return [];
      }

      // Check if we're on the base branch
      if (currentBranch === baseBranch) {
        // On base branch with no remote, return empty array
        return [];
      }

      // Compare current branch to base branch
      range = `${baseBranch}...HEAD`;
    }

    // Get files in the determined range
    return getFilesInRange({ range, cwd: resolvedCwd });
  } catch {
    return null;
  }
}
