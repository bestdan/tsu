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

export type ChangeType = 'committed' | 'staged' | 'unstaged';

export interface GetChangedFilesOptions {
  /** The type of changes to get. Defaults to 'committed' */
  type?: ChangeType;
  /** The base branch to compare against for committed changes. Defaults to 'main' */
  baseBranch?: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Gets the list of changed files in the repository.
 * @param options - Configuration options
 * @returns Array of file paths, or null if not in a git repo or on error
 */
export function getChangedFiles(
  options: GetChangedFilesOptions = {}
): string[] | null {
  const {
    type = 'committed',
    baseBranch = 'main',
    cwd = process.cwd(),
  } = options;

  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);
    let command: string;

    switch (type) {
      case 'staged':
        // Get staged changes
        command = 'git diff --name-only --cached';
        break;

      case 'unstaged':
        // Get unstaged changes
        command = 'git diff --name-only';
        break;

      case 'committed': {
        // Get committed changes compared to base branch
        // First check if base branch exists
        try {
          execSync(`git rev-parse --verify ${baseBranch}`, {
            cwd: resolvedCwd,
            stdio: 'pipe',
          });
        } catch {
          // Base branch doesn't exist, return empty array
          return [];
        }

        // Check if we're on the base branch
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: resolvedCwd,
          stdio: 'pipe',
          encoding: 'utf-8',
        }).trim();

        if (currentBranch === baseBranch) {
          // On base branch, no committed changes to compare
          return [];
        }

        // Compare current branch to base branch
        command = `git diff --name-only ${baseBranch}...HEAD`;
        break;
      }
    }

    const result = execSync(command, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Split by newlines and filter out empty strings
    return result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    return null;
  }
}

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
