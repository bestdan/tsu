import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';

/**
 * Checks if a file has unstaged changes in git.
 * @param file - The file path to check (relative to cwd). If not provided, checks the entire repository.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns true if the file (or repository) has unstaged changes, false otherwise
 */
export function hasUnstagedChanges(file?: string, cwd: string = process.cwd()): boolean {
  try {
    if (!isGitRepo(cwd)) {
      return false;
    }

    const command = file ? `git diff --quiet -- ${escapeShellArg(file)}` : 'git diff --quiet';

    execSync(command, {
      cwd: resolve(cwd),
      stdio: 'pipe',
    });
    return false; // No changes
  } catch {
    return true; // Has changes
  }
}
