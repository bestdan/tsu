import { callClaude } from './call-claude.js';
import { getStagedDiff } from '../diff/get-staged-diff.js';

export interface GenerateCommitMessageOptions {
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Generates a commit message from staged changes using Claude CLI.
 * @param options - Configuration options
 * @returns The generated commit message, or null on error
 * @throws Error if Claude CLI is not available or fails
 */
/* v8 ignore next -- @preserve */
export function generateCommitMessage(
  options: GenerateCommitMessageOptions = {}
): string | null {
  const { cwd = process.cwd() } = options;

  // Get staged diff
  const diff = getStagedDiff(cwd);
  if (!diff) {
    return null;
  }

  // Prepare the prompt for Claude
  const prompt = `Generate a commit message from the git diff provided via stdin.

Output format: Plain text only. No markdown. No code blocks. No explanations.

Start immediately with the commit message in Conventional Commits format:

<type>(<scope>): <description>
<optional body>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

IMPORTANT: Do not ask questions. Do not add commentary. Do not add any attribution text, signatures, or metadata. Do not add "Generated with" text or "Co-Authored-By" lines. Output ONLY the commit message itself, nothing else.`;

  // Post-process function to filter out git diff metadata
  const postProcess = (output: string): string => {
    const lines = output.split('\n');
    const filteredLines = lines.filter(
      (line) =>
        !line.startsWith('diff --git') &&
        !line.startsWith('new file mode') &&
        !line.startsWith('deleted file mode') &&
        !line.startsWith('index ')
    );
    return filteredLines.join('\n').trim();
  };

  return callClaude({ prompt, input: diff, cwd, postProcess });
}
