import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus } from '../utils/git.js';
import { ensureCondition } from '../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
export function gitCodeownersCheck(options = {}) {
    const verbose = options.verbose || false;
    logIfVerbose(verbose, '🔍 Checking CODEOWNERS files...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    const cwd = process.cwd();
    ensureCondition(isCommandInstalled('coach'), verbose ? '⚠️  Warning: coach not installed, skipping' : '', { exitCode: 0 });
    const gitStatusBefore = getGitStatus(cwd);
    ensureCondition(gitStatusBefore !== null, 'Error: Failed to get git status');
    logIfVerbose(verbose, '🔧 Running coach codeowners generate...');
    try {
        execSync('coach codeowners generate', {
            cwd,
            stdio: verbose ? 'inherit' : 'pipe',
        });
    }
    catch (error) {
        console.error('Error: Failed to run coach codeowners generate');
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
    const gitStatusAfter = getGitStatus(cwd);
    ensureCondition(gitStatusAfter !== null, 'Error: Failed to get git status');
    if (gitStatusBefore && gitStatusAfter && gitStatusBefore !== gitStatusAfter) {
        console.error('');
        console.error('❌ CODEOWNERS files are out of sync!');
        console.error("Please run 'coach codeowners generate' locally and commit the changes to your branch.");
        console.error('');
        console.error('Modified files:');
        try {
            const beforeLines = new Set(gitStatusBefore.split('\n').filter((line) => line.length > 0));
            const afterLines = gitStatusAfter.split('\n').filter((line) => line.length > 0);
            const changedFiles = afterLines.filter((line) => !beforeLines.has(line));
            if (changedFiles.length > 0) {
                changedFiles.forEach((line) => {
                    const match = line.match(/^..\s+(.+)$/);
                    if (match && match[1]) {
                        console.error(`   ${match[1]}`);
                    }
                });
            }
            else {
                console.error('   (Unable to determine changed files)');
            }
        }
        catch {
            console.error('   (Unable to determine changed files)');
        }
        console.error('');
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ CODEOWNERS files are in sync');
    process.exit(0);
}
