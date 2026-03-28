import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from './is-git-repo.js';

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
    const upstreamBranch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{upstream}', {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const remoteBranch = upstreamBranch.trim();
    return remoteBranch.length > 0 ? remoteBranch : null;
  } catch {
    return null;
  }
}
