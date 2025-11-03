import { isGitRepo, getGitRoot } from './utils/git.js';
import type { GetValueCommandOptions } from '../../types/command-options.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitRootOptions extends GetValueCommandOptions {}

export function gitRoot(path?: string, options: GitRootOptions = {}): void {
  const targetPath = path || process.cwd();
  const verbose = options.verbose || false;

  if (!isGitRepo(targetPath)) {
    if (verbose) {
      console.error('Error: Not in a git repository');
    }
    process.exit(1);
  }

  const root = getGitRoot(targetPath);

  if (root === null) {
    console.error('Error: Failed to get git root');
    process.exit(1);
  }

  if (verbose) {
    console.error(`Git root: ${root}`);
  }

  // Output git root to stdout for piping
  console.log(root);
}
