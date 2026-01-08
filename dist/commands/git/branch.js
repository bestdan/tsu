import { getCurrentBranch, isGitRepo } from './utils/git.js';
import { logError } from '../../utils/error-logger.js';
export function gitBranch(path, options = {}) {
    const cwd = path || process.cwd();
    if (!isGitRepo(cwd)) {
        const error = new Error('Not in a git repository');
        logError(error, `tsu git branch${path ? ` ${path}` : ''}`);
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    const branch = getCurrentBranch(cwd);
    if (branch === null) {
        const error = new Error('Failed to get current branch');
        logError(error, `tsu git branch${path ? ` ${path}` : ''}`);
        console.error('Error: Failed to get current branch');
        process.exit(1);
    }
    if (options.verbose) {
        console.error('Current branch:');
    }
    console.log(branch);
}
