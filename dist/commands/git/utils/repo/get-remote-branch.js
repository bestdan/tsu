import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from './is-git-repo.js';
import { getCurrentBranch } from './get-current-branch.js';
export function getRemoteBranch(cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        const currentBranch = getCurrentBranch(resolvedCwd);
        if (!currentBranch) {
            return null;
        }
        const remoteBranch = `origin/${currentBranch}`;
        execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
            cwd: resolvedCwd,
            stdio: 'pipe',
        });
        return remoteBranch;
    }
    catch {
        return null;
    }
}
