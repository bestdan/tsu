import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Checks if the given directory (or current working directory) is inside a git repository.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns true if inside a git repo, false otherwise
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  try {
    // Check if directory exists
    if (!existsSync(cwd)) {
      return false;
    }

    // Use git rev-parse to check if we're in a git repository
    const result = execSync('git rev-parse --is-inside-work-tree', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return result.trim() === 'true';
  } catch {
    // git command failed, not a git repository
    return false;
  }
}
