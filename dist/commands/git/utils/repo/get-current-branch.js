import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from './is-git-repo.js';
export function getCurrentBranch(cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const result = execSync('git rev-parse --abbrev-ref HEAD', {
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
