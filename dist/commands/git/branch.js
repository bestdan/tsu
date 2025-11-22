import { getCurrentBranch, isGitRepo } from './utils/git.js';
export function gitBranch(path, options = {}) {
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
        console.error('Current branch:');
    }
    console.log(branch);
}
