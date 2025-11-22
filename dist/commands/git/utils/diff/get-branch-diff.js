import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
export function getBranchDiff(baseBranch = 'main', cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        try {
            execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
                cwd: resolvedCwd,
                stdio: 'pipe',
            });
        }
        catch {
            return null;
        }
        const result = execSync(`git diff ${escapeShellArg(baseBranch)}...HEAD`, {
            cwd: resolvedCwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        const diff = result.trim();
        return diff.length > 0 ? diff : null;
    }
    catch {
        return null;
    }
}
