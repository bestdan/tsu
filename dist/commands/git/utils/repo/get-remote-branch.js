import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from './is-git-repo.js';
export function getRemoteBranch(cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        const upstreamBranch = execSync('git rev-parse --abbrev-ref --symbolic-full-name @{upstream}', {
            cwd: resolvedCwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        const remoteBranch = upstreamBranch.trim();
        return remoteBranch.length > 0 ? remoteBranch : null;
    }
    catch {
        return null;
    }
}
