import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
export function hasUnstagedChanges(file, cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return false;
        }
        const command = file ? `git diff --quiet -- ${escapeShellArg(file)}` : 'git diff --quiet';
        execSync(command, {
            cwd: resolve(cwd),
            stdio: 'pipe',
        });
        return false;
    }
    catch {
        return true;
    }
}
