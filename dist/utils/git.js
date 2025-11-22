import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeShellArg } from './shell.js';
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
export function getChangedFiles(options = {}) {
    const { type = 'committed', baseBranch = 'main', cwd = process.cwd(), } = options;
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        let command;
        switch (type) {
            case 'staged':
                command = 'git diff --name-only --cached';
                break;
            case 'unstaged':
                command = 'git diff --name-only';
                break;
            case 'committed': {
                try {
                    execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
                        cwd: resolvedCwd,
                        stdio: 'pipe',
                    });
                }
                catch {
                    return [];
                }
                const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
                    cwd: resolvedCwd,
                    stdio: 'pipe',
                    encoding: 'utf-8',
                }).trim();
                if (currentBranch === baseBranch) {
                    return [];
                }
                command = `git diff --name-only ${escapeShellArg(baseBranch)}...HEAD`;
                break;
            }
        }
        const result = execSync(command, {
            cwd: resolvedCwd,
            stdio: 'pipe',
            encoding: 'utf-8',
        });
        return result
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
    }
    catch {
        return null;
    }
}
export function getAllChangedFiles(cwd = process.cwd()) {
    const committedFiles = getChangedFiles({ type: 'committed', cwd }) || [];
    const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
    const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];
    return Array.from(new Set([...committedFiles, ...stagedFiles, ...unstagedFiles]));
}
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
export function getBranchDiff(baseBranch = 'main', cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return null;
        }
        const resolvedCwd = resolve(cwd);
        try {
            execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
                cwd: resolvedCwd,
                stdio: 'pipe',
            });
        }
        catch {
            return null;
        }
        const result = execSync(`git diff ${escapeShellArg(baseBranch)}...HEAD`, {
            cwd: resolvedCwd,
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
export function isMainBranch(mainBranch = 'main', cwd = process.cwd()) {
    const currentBranch = getCurrentBranch(cwd);
    return currentBranch === mainBranch;
}
export function generateCommitMessage(options = {}) {
    const { cwd = process.cwd() } = options;
    try {
        const diff = getStagedDiff(cwd);
        if (!diff) {
            return null;
        }
        const prompt = `Generate a commit message from the git diff provided via stdin.

Output format: Plain text only. No markdown. No code blocks. No explanations.

Start immediately with the commit message in Conventional Commits format:

<type>(<scope>): <description>
<optional body>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

IMPORTANT: Do not ask questions. Do not add commentary. Do not add any attribution text, signatures, or metadata. Do not add "Generated with" text or "Co-Authored-By" lines. Output ONLY the commit message itself, nothing else.`;
        const result = execSync('claude -p', {
            cwd: resolve(cwd),
            input: `${prompt}\n\n${diff}`,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
        });
        const lines = result.split('\n');
        const filteredLines = lines.filter((line) => !line.startsWith('diff --git') &&
            !line.startsWith('new file mode') &&
            !line.startsWith('deleted file mode') &&
            !line.startsWith('index '));
        return filteredLines.join('\n').trim();
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error('Claude CLI not found. Please install it from https://github.com/anthropics/claude-cli');
        }
        throw error;
    }
}
export function generatePRDescription(options = {}) {
    const { baseBranch = 'main', cwd = process.cwd() } = options;
    try {
        if (isMainBranch(baseBranch, cwd)) {
            throw new Error(`Cannot generate PR description: currently on ${baseBranch} branch`);
        }
        const diff = getBranchDiff(baseBranch, cwd);
        if (!diff) {
            throw new Error(`No changes found between ${baseBranch} and current branch`);
        }
        const prompt = `Generate a GitHub pull request description from the git diff provided via stdin.

Output format: Plain text with markdown formatting. Use standard GitHub PR description structure.

Structure:
## Summary
Brief overview of what this PR accomplishes (2-3 sentences max)

## Changes
- Bullet point list of key changes
- Focus on what changed and why
- Group related changes together

## Testing
Brief notes on how to test these changes or what was tested

IMPORTANT: Start immediately with the PR description. Do not ask questions. Do not add meta-commentary about the PR itself. Do not add any attribution text, signatures, or metadata. Do not add "Generated with" text or "Co-Authored-By" lines. Output ONLY the PR description content itself, nothing else.`;
        const result = execSync('claude -p', {
            cwd: resolve(cwd),
            input: `${prompt}\n\n${diff}`,
            stdio: ['pipe', 'pipe', 'pipe'],
            encoding: 'utf-8',
        });
        return result.trim();
    }
    catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
            throw new Error('Claude CLI not found. Please install it from https://github.com/anthropics/claude-cli');
        }
        throw error;
    }
}
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
export function hasUnstagedChanges(file, cwd = process.cwd()) {
    try {
        if (!isGitRepo(cwd)) {
            return false;
        }
        const command = file
            ? `git diff --quiet -- ${escapeShellArg(file)}`
            : 'git diff --quiet';
        execSync(command, {
            cwd: resolve(cwd),
            stdio: 'pipe',
        });
        return false;
    }
    catch {
        return true;
    }
}
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
//# sourceMappingURL=git.js.map