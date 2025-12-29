import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
import { getCurrentBranch } from '../repo/get-current-branch.js';
import { getFilesInRange } from './get-files-in-range.js';
export function getFilesToPush(options = {}) {
    const { cwd = process.cwd(), baseBranch = 'main' } = typeof options === 'string' ? { cwd: options } : options;
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        const currentBranch = getCurrentBranch(resolvedCwd);
        if (!currentBranch) {
            return null;
        }
        if (currentBranch === baseBranch) {
            return [];
        }
        try {
            execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
                cwd: resolvedCwd,
                stdio: 'pipe',
            });
        }
        catch {
            return [];
        }
        const range = `${baseBranch}...HEAD`;
        return getFilesInRange({ range, cwd: resolvedCwd });
    }
    catch {
        return null;
    }
}
