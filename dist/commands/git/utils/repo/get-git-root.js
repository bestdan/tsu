import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
export function getGitRoot(cwd = process.cwd()) {
    try {
        if (!existsSync(cwd)) {
            return null;
        }
        const result = execSync('git rev-parse --show-toplevel', {
            cwd: resolve(cwd),
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return result.trim();
    }
    catch {
        return null;
    }
}
