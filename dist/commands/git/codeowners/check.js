import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus } from '../utils/git.js';
import { ensureCondition } from '../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
import { getNewlyChangedFiles } from '../../../utils/git-status.js';
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
    if (gitStatusBefore === null || gitStatusAfter === null)
        return;
    const changedFiles = getNewlyChangedFiles(gitStatusBefore, gitStatusAfter).filter(isCodeownersFile);
    if (changedFiles.length > 0) {
        console.error('');
        console.error('❌ CODEOWNERS files are out of sync!');
        console.error("Please run 'coach codeowners generate' locally and commit the changes to your branch.");
        console.error('');
        console.error('Modified files:');
        changedFiles.forEach((file) => {
            console.error(`   ${file}`);
        });
        console.error('');
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ CODEOWNERS files are in sync');
    logIfVerbose(verbose, '🔍 Checking for unowned files...');
    try {
        execSync('coach codeowners unowned --check', {
            cwd,
            stdio: verbose ? 'inherit' : 'pipe',
        });
    }
    catch (error) {
        console.error('');
        console.error('❌ There are unowned files in the repository!');
        console.error('Please add the necessary OWNERSHIP files to appropriately tag owners.');
        if (error && typeof error === 'object' && 'stdout' in error) {
            const stdout = error.stdout?.toString().trim();
            if (stdout) {
                console.error('');
                console.error('Unowned files:');
                console.error(stdout);
            }
        }
        if (error && typeof error === 'object' && 'stderr' in error) {
            const stderr = error.stderr?.toString().trim();
            if (stderr) {
                console.error(stderr);
            }
        }
        console.error('');
        process.exit(1);
    }
    logIfVerbose(verbose, '✅ No unowned files detected!');
    process.exit(0);
}
function isCodeownersFile(file) {
    return file.split('/').pop() === 'CODEOWNERS';
}
