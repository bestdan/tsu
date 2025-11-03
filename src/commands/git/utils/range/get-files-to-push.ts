import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
import { getCurrentBranch } from '../repo/get-current-branch.js';
import { getFilesInRange } from './get-files-in-range.js';

/**
 * Gets the list of files in commits that would be pushed to upstream.
 * Compares HEAD against the remote tracking branch (e.g., origin/feature-branch).
 * Equivalent to: git diff --name-only origin/$(git branch --show-current)..HEAD
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns Array of file paths, or null if not in a git repo or no upstream
 */
export function getFilesToPush(cwd: string = process.cwd()): string[] | null {
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
    try {
      execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
        cwd: resolvedCwd,
        stdio: 'pipe',
      });
    } catch {
      // Remote branch doesn't exist
      return null;
    }

    // Get files in the range: origin/current-branch..HEAD
    return getFilesInRange({ range: `${remoteBranch}..HEAD`, cwd: resolvedCwd });
  } catch {
    return null;
  }
}
