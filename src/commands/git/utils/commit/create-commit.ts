import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';

export interface CreateCommitOptions {
  /** The commit message to use */
  message: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Creates a git commit with the provided message.
 * @param options - Configuration options
 * @returns true on success, false on error
 */
export function createCommit(options: CreateCommitOptions): boolean {
  const { message, cwd = process.cwd() } = options;

  try {
    if (!isGitRepo(cwd)) {
      return false;
    }

    // Use -F - to read message from stdin to handle multiline messages properly
    execSync('git commit -F -', {
      cwd: resolve(cwd),
      input: message,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });

    return true;
  } catch {
    /* v8 ignore next -- @preserve */
    return false;
  }
}
