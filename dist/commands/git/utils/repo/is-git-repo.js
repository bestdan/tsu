import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function isGitRepo(cwd = process.cwd()) {
    try {
        if (!existsSync(cwd)) {
            return false;
        }
        const result = execSync('git rev-parse --is-inside-work-tree', {
            cwd: resolve(cwd),
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return result.trim() === 'true';
    }
    catch {
        return false;
    }
}
