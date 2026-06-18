import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { getCurrentBranch } from '../repo/get-current-branch.js';
import { getFilesInRange } from './get-files-in-range.js';
import { getFilesInRangeWithStatus } from './get-files-in-range-with-status.js';
export function getFilesToPushWithStatus(options = {}) {
    const { cwd = process.cwd(), baseBranch = 'main' } = options;
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
        const featureUniqueFiles = getFilesInRangeWithStatus({
            range: `${baseBranch}...HEAD`,
            cwd: resolvedCwd,
        });
        if (!featureUniqueFiles) {
            return [];
        }
        const remoteBranch = `origin/${currentBranch}`;
        try {
            execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
                cwd: resolvedCwd,
                stdio: 'pipe',
            });
        }
        catch {
            return featureUniqueFiles;
        }
        const unpushedFiles = getFilesInRange({
            range: `${remoteBranch}..HEAD`,
            cwd: resolvedCwd,
        });
        if (!unpushedFiles) {
            return [];
        }
        const unpushedSet = new Set(unpushedFiles);
        return featureUniqueFiles.filter((entry) => unpushedSet.has(entry.path));
    }
    catch {
        return null;
    }
}
