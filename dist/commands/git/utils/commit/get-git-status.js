import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';
export function getGitStatus(cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const result = execSync('git status --porcelain', {
            cwd: resolve(cwd),
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return result;
    }
    catch {
        return null;
    }
}
