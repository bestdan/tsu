import { isGitRepo, getGitRoot } from './utils/git.js';
import { logError } from '../../utils/error-logger.js';
export function gitRoot(path, options = {}) {
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
    console.log(root);
}
