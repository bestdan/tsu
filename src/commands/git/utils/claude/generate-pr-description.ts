import { callClaude } from './call-claude.js';
import { getBranchDiff } from '../diff/get-branch-diff.js';
import { isMainBranch } from '../branch/is-main-branch.js';

export interface GeneratePRDescriptionOptions {
  /** The base branch to compare against. Defaults to 'main' */
  baseBranch?: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Generates a GitHub PR description from branch changes using Claude CLI.
 * @param options - Configuration options
 * @returns The generated PR description, or null on error
 * @throws Error if Claude CLI is not available or fails, or if on main branch
 */
/* v8 ignore next -- @preserve */
export function generatePRDescription(
  options: GeneratePRDescriptionOptions = {}
): string | null {
  const { baseBranch = 'main', cwd = process.cwd() } = options;

  // Check if on main branch
  if (isMainBranch(baseBranch, cwd)) {
    throw new Error(
      `Cannot generate PR description: currently on ${baseBranch} branch`
    );
  }

  // Get branch diff
  const diff = getBranchDiff(baseBranch, cwd);
  if (!diff) {
    throw new Error(
      `No changes found between ${baseBranch} and current branch`
    );
  }

  // Prepare the prompt for Claude
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
