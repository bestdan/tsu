import { isGitRepo } from './utils/git.js';
import { displayChangedFiles } from '../../utils/command-helpers.js';
import { logError } from '../../utils/error-logger.js';
export function gitChanged(options = {}) {
    if (!isGitRepo()) {
        const error = new Error('Not in a git repository');
        logError(error, 'tsu git changed');
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    displayChangedFiles(options);
}
