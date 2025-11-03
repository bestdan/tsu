import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';

/**
 * Gets the git status in porcelain format.
 * This is useful for comparing repository state before and after operations.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns The git status output, or null if not in a git repo
 */
/* v8 ignore next -- @preserve */
export function getGitStatus(cwd: string = process.cwd()): string | null {
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const result = execSync('git status --porcelain', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return result;
  } catch {
    return null;
  }
}
