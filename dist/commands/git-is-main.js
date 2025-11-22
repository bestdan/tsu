import { getCurrentBranch, isGitRepo } from '../utils/git.js';
export function gitIsMain(path, options = {}) {
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
        }
        else {
            console.error(`Current branch is ${branch} (not ${mainBranch})`);
        }
    }
    process.exit(isMain ? 0 : 1);
}
//# sourceMappingURL=git-is-main.js.map