import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { getCurrentBranch } from '../repo/get-current-branch.js';
import { getFilesInRange } from './get-files-in-range.js';
export function getFilesToPush(options = {}) {
    const { cwd = process.cwd(), baseBranch = 'main' } = typeof options === 'string' ? { cwd: options } : options;
    try {
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
        const remoteBranch = `origin/${currentBranch}`;
        let hasRemote = true;
        try {
            execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
                cwd: resolvedCwd,
                stdio: 'pipe',
            });
        }
        catch {
            hasRemote = false;
        }
        if (hasRemote) {
            const featureUniqueFiles = getFilesInRange({
                range: `${baseBranch}...HEAD`,
                cwd: resolvedCwd,
            });
            const unpushedFiles = getFilesInRange({
                range: `${remoteBranch}..HEAD`,
                cwd: resolvedCwd,
            });
            if (!featureUniqueFiles || !unpushedFiles) {
                return [];
            }
            const featureUniqueSet = new Set(featureUniqueFiles);
            return unpushedFiles.filter((file) => featureUniqueSet.has(file));
        }
        const range = `${baseBranch}...HEAD`;
        return getFilesInRange({ range, cwd: resolvedCwd });
    }
    catch {
        return null;
    }
}
