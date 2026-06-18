import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../../utils/shell.js';
export function getFilesInRange(options) {
    const { range, cwd = process.cwd(), filter } = options;
    try {
        const resolvedCwd = resolve(cwd);
        const command = `git diff --name-only --diff-filter=ACMR ${escapeShellArg(range)}`;
        const result = execSync(command, {
            cwd: resolvedCwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        const files = result
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        return filter ? files.filter(filter) : files;
    }
    catch {
        return null;
    }
}
