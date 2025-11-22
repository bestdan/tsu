import { isGitRepo, getStagedDiff, generateCommitMessage, createCommit } from './utils/git.js';
import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
export function gitCommitMsg(options = {}) {
    if (!isGitRepo()) {
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    ensureClaudeInstalled();
    const verbose = options.verbose || false;
    const diff = getStagedDiff();
    if (!diff) {
        console.error('Error: No changes staged for commit. Use "git add" first.');
        process.exit(1);
    }
    logIfVerbose(verbose, 'Generating commit message with Claude...');
    let message;
    try {
        message = generateCommitMessage();
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Error: Failed to generate commit message');
        }
        process.exit(1);
    }
    if (!message) {
        console.error('Error: Failed to generate commit message');
        process.exit(1);
    }
    if (options.commit) {
        logIfVerbose(verbose, 'Creating commit...');
        const success = createCommit({ message });
        if (!success) {
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
