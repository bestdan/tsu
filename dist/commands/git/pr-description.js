import { isGitRepo, generatePRDescription } from './utils/git.js';
import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
import { logError } from '../../utils/error-logger.js';
export function gitPRDescription(options = {}) {
    if (!isGitRepo()) {
        const error = new Error('Not in a git repository');
        logError(error, 'tsu git pr-description');
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    ensureClaudeInstalled();
    const baseBranch = options.baseBranch || 'main';
    const verbose = options.verbose || false;
    if (verbose) {
        console.error(`Generating PR description comparing to ${baseBranch} branch...`);
    }
    let description;
    try {
        description = generatePRDescription({ baseBranch });
    }
    catch (error) {
        logError(error, `tsu git pr-description${baseBranch !== 'main' ? ` -b ${baseBranch}` : ''}`);
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Error: Failed to generate PR description');
        }
        process.exit(1);
    }
    if (!description) {
        const error = new Error('Failed to generate PR description');
        logError(error, `tsu git pr-description${baseBranch !== 'main' ? ` -b ${baseBranch}` : ''}`);
        console.error('Error: Failed to generate PR description');
        process.exit(1);
    }
    console.log(description);
}
