import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';
export function getStagedDiff(cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const result = execSync('git diff --cached', {
            cwd: resolve(cwd),
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
