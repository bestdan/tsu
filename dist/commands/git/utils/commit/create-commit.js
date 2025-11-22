import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { isGitRepo } from '../repo/is-git-repo.js';
export function createCommit(options) {
    const { message, cwd = process.cwd() } = options;
    try {
        if (!isGitRepo(cwd)) {
            return false;
        }
        execSync('git commit -F -', {
            cwd: resolve(cwd),
            input: message,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
        });
        return true;
    }
    catch {
        return false;
    }
}
