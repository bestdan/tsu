import { isGitRepo, getGitRoot } from './utils/git.js';
import type { GetValueCommandOptions } from '../../types/command-options.js';
import { logError } from '../../utils/error-logger.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitRootOptions extends GetValueCommandOptions {}

export function gitRoot(path?: string, options: GitRootOptions = {}): void {
  const targetPath = path || process.cwd();
  const verbose = options.verbose || false;

  if (!isGitRepo(targetPath)) {
    const error = new Error('Not in a git repository');
    logError(error, `tsu git root${path ? ` ${path}` : ''}`);
    if (verbose) {
      console.error('Error: Not in a git repository');
    }
    process.exit(1);
  }

  const root = getGitRoot(targetPath);

  if (root === null) {
    const error = new Error('Failed to get git root');
    logError(error, `tsu git root${path ? ` ${path}` : ''}`);
    console.error('Error: Failed to get git root');
    process.exit(1);
  }

  if (verbose) {
    console.error(`Git root: ${root}`);
  }

  // Output git root to stdout for piping
  console.log(root);
}
