import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from './is-git-repo.js';
import { getCurrentBranch } from './get-current-branch.js';

/**
 * Gets the remote tracking branch for the current branch (e.g., "origin/feature-branch").
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns The remote branch name (e.g., "origin/feature"), or null if not in a git repo or no remote exists
 */
export function getRemoteBranch(cwd: string = process.cwd()): string | null {
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);
    const currentBranch = getCurrentBranch(resolvedCwd);

    if (!currentBranch) {
      return null;
    }

    const remoteBranch = `origin/${currentBranch}`;

    // Verify the remote branch exists
    execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
      cwd: resolvedCwd,
      stdio: 'pipe',
    });

    return remoteBranch;
  } catch {
    return null;
  }
}
