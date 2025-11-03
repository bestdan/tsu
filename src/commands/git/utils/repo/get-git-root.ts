import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Gets the root directory of the git repository.
 * @param cwd - The directory to start from. Defaults to process.cwd()
 * @returns The absolute path to the git root, or null if not in a git repo
 */
export function getGitRoot(cwd: string = process.cwd()): string | null {
  try {
    if (!existsSync(cwd)) {
      return null;
    }

    const result = execSync('git rev-parse --show-toplevel', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return result.trim();
  } catch {
    return null;
  }
}
