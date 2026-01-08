import { isGitRepo, getStagedDiff, generateCommitMessage, createCommit } from './utils/git.js';
import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import { logError } from '../../utils/error-logger.js';
export function gitCommitMsg(options = {}) {
    if (!isGitRepo()) {
        const error = new Error('Not in a git repository');
        logError(error, 'tsu git commit-msg');
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    ensureClaudeInstalled();
    const verbose = options.verbose || false;
    const diff = getStagedDiff();
    if (!diff) {
        const error = new Error('No changes staged for commit');
        logError(error, 'tsu git commit-msg');
        console.error('Error: No changes staged for commit. Use "git add" first.');
        process.exit(1);
    }
    logIfVerbose(verbose, 'Generating commit message with Claude...');
    let message;
    try {
        message = generateCommitMessage();
    }
    catch (error) {
        logError(error, 'tsu git commit-msg');
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Error: Failed to generate commit message');
        }
        process.exit(1);
    }
    if (!message) {
        const error = new Error('Failed to generate commit message');
        logError(error, 'tsu git commit-msg');
        console.error('Error: Failed to generate commit message');
        process.exit(1);
    }
    if (options.commit) {
        logIfVerbose(verbose, 'Creating commit...');
        const success = createCommit({ message });
        if (!success) {
            const error = new Error('Failed to create commit');
            logError(error, 'tsu git commit-msg --commit');
            console.error('Error: Failed to create commit');
            process.exit(1);
        }
        logIfVerbose(verbose, 'Commit created successfully!');
        console.log(message);
    }
    else {
        console.log(message);
    }
}
