import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';

/**
 * Gets the staged diff from git.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns The staged diff as a string, or null if not in a git repo or no staged changes
 */
export function getStagedDiff(cwd: string = process.cwd()): string | null {
  try {
    if (!isGitRepo(cwd)) {
      /* v8 ignore next -- @preserve */
      return null;
    }

    const result = execSync('git diff --cached', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const diff = result.trim();
    return diff.length > 0 ? diff : null;
  } catch {
    /* v8 ignore next -- @preserve */
    return null;
  }
}
