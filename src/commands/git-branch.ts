import { getCurrentBranch, isGitRepo } from '../utils/git.js';

export interface GitBranchOptions {
  verbose?: boolean;
}

export function gitBranch(
  path: string | undefined,
  options: GitBranchOptions = {}
): void {
  const cwd = path || process.cwd();

  if (!isGitRepo(cwd)) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  const branch = getCurrentBranch(cwd);

  if (branch === null) {
    console.error('Error: Failed to get current branch');
    process.exit(1);
  }

  if (options.verbose) {
    // Output label to stderr before the actual output
    console.error('Current branch:');
  }

  // Output branch name to stdout for pipe-friendliness
  console.log(branch);
}
