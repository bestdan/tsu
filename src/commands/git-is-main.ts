import { getCurrentBranch, isGitRepo } from '../utils/git.js';

export interface GitIsMainOptions {
  verbose?: boolean;
  branch?: string;
}

export function gitIsMain(
  path: string | undefined,
  options: GitIsMainOptions = {}
): void {
  const cwd = path || process.cwd();
  const mainBranch = options.branch || 'main';

  if (!isGitRepo(cwd)) {
    if (options.verbose) {
      console.error('Error: Not in a git repository');
    }
    process.exit(1);
  }

  const branch = getCurrentBranch(cwd);

  if (branch === null) {
    if (options.verbose) {
      console.error('Error: Failed to get current branch');
    }
    process.exit(1);
  }

  const isMain = branch === mainBranch;

  if (options.verbose) {
    if (isMain) {
      console.error(`Current branch is ${mainBranch}`);
    } else {
      console.error(`Current branch is ${branch} (not ${mainBranch})`);
    }
  }

  // Exit code only - 0 if on main branch, 1 if not
  process.exit(isMain ? 0 : 1);
}
