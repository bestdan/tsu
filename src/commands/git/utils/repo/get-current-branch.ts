import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from './is-git-repo.js';

/**
 * Gets the current git branch name.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns The branch name, or null if not in a git repo
 */
export function getCurrentBranch(cwd: string = process.cwd()): string | null {
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const result = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return result.trim();
  } catch {
    return null;
  }
}
