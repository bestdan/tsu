import { callClaude } from './call-claude.js';
import { getBranchDiff } from '../diff/get-branch-diff.js';
import { isMainBranch } from '../branch/is-main-branch.js';
export function generatePRDescription(options = {}) {
    const { baseBranch = 'main', cwd = process.cwd() } = options;
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
    return callClaude({ prompt, input: diff, cwd });
}
