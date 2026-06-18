import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
import { isGitRepo } from '../repo/is-git-repo.js';
import { parseNameStatus } from '../changed-files/changed-file-entry.js';
export function getFilesInRangeWithStatus(options) {
    const { range, cwd = process.cwd() } = options;
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        const command = `git diff --name-status --diff-filter=ACMR ${escapeShellArg(range)}`;
        const result = execSync(command, {
            cwd: resolvedCwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return parseNameStatus(result);
    }
    catch {
        return null;
    }
}
