import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { escapeShellArg } from '../../../utils/shell.js';

/**
 * Checks if the given directory (or current working directory) is inside a git repository.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns true if inside a git repo, false otherwise
 */
export function isGitRepo(cwd: string = process.cwd()): boolean {
  try {
    // Check if directory exists
    if (!existsSync(cwd)) {
      return false;
    }

    // Use git rev-parse to check if we're in a git repository
    const result = execSync('git rev-parse --is-inside-work-tree', {
      cwd: resolve(cwd),
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    return result.trim() === 'true';
  } catch {
    // git command failed, not a git repository
    return false;
  }
}

/**
 * Gets the root directory of the git repository.
 * @param cwd - The directory to start from. Defaults to process.cwd()
 * @returns The absolute path to the git root, or null if not in a git repo
 */
export function getGitRoot(cwd: string = process.cwd()): string | null {
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
  } catch {
    return null;
  }
}

export type ChangeType = 'committed' | 'staged' | 'unstaged';

export interface GetChangedFilesOptions {
  /** The type of changes to get. Defaults to 'committed' */
  type?: ChangeType;
  /** The base branch to compare against for committed changes. Defaults to 'main' */
  baseBranch?: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Gets the list of changed files in the repository.
 * @param options - Configuration options
 * @returns Array of file paths, or null if not in a git repo or on error
 */
export function getChangedFiles(
  options: GetChangedFilesOptions = {}
): string[] | null {
  const {
    type = 'committed',
    baseBranch = 'main',
    cwd = process.cwd(),
  } = options;

  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);
    let command: string;

    switch (type) {
      case 'staged':
        // Get staged changes
        command = 'git diff --name-only --cached';
        break;

      case 'unstaged':
        // Get unstaged changes
        command = 'git diff --name-only';
        break;

      case 'committed': {
        // Get committed changes compared to base branch
        // First check if base branch exists
        try {
          execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
            cwd: resolvedCwd,
            stdio: 'pipe',
          });
        } catch {
          // Base branch doesn't exist, return empty array
          return [];
        }

        // Check if we're on the base branch
        const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
          cwd: resolvedCwd,
          stdio: 'pipe',
          encoding: 'utf-8',
        }).trim();

        if (currentBranch === baseBranch) {
          // On base branch, no committed changes to compare
          return [];
        }

        // Compare current branch to base branch
        command = `git diff --name-only ${escapeShellArg(baseBranch)}...HEAD`;
        break;
      }
    }

    const result = execSync(command, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Split by newlines and filter out empty strings
    return result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  } catch {
    return null;
  }
}

/**
 * Gets all changed files (committed, staged, and unstaged) combined into a single unique list.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns Array of unique file paths
 */
export function getAllChangedFiles(cwd: string = process.cwd()): string[] {
  const committedFiles = getChangedFiles({ type: 'committed', cwd }) || [];
  const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
  const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];

  // Combine all changed files and remove duplicates
  return Array.from(
    new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])
  );
}

/**
 * Gets the current git branch name.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns The branch name, or null if not in a git repo
 */
export function getCurrentBranch(cwd: string = process.cwd()): string | null {
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
  } catch {
    return null;
  }
}

/**
 * Gets the staged diff from git.
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns The staged diff as a string, or null if not in a git repo or no staged changes
 */
export function getStagedDiff(cwd: string = process.cwd()): string | null {
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
  } catch {
    return null;
  }
}

/**
 * Gets the diff between a base branch and HEAD.
 * @param options - Configuration options
 * @returns The diff as a string, or null if not in a git repo or on error
 */
export function getBranchDiff(
  baseBranch = 'main',
  cwd: string = process.cwd()
): string | null {
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);

    // Check if base branch exists
    try {
      execSync(`git rev-parse --verify ${escapeShellArg(baseBranch)}`, {
        cwd: resolvedCwd,
        stdio: 'pipe',
      });
    } catch {
      return null;
    }

    const result = execSync(`git diff ${escapeShellArg(baseBranch)}...HEAD`, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    const diff = result.trim();
    return diff.length > 0 ? diff : null;
  } catch {
    return null;
  }
}

/**
 * Checks if the current branch is the main branch.
 * @param mainBranch - The name of the main branch to check against. Defaults to 'main'
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns true if on main branch, false otherwise
 */
export function isMainBranch(
  mainBranch = 'main',
  cwd: string = process.cwd()
): boolean {
  const currentBranch = getCurrentBranch(cwd);
  return currentBranch === mainBranch;
}

export interface CallClaudeOptions {
  /** The prompt to send to Claude */
  prompt: string;
  /** The input content to provide via stdin */
  input: string;
  /** The directory to run the command in. Defaults to process.cwd() */
  cwd?: string;
  /** Optional post-processing function to apply to Claude's output */
  postProcess?: (output: string) => string;
}

/**
 * Calls Claude CLI with a prompt and input content.
 * This is a general interface for interacting with Claude CLI.
 * @param options - Configuration options
 * @returns The output from Claude, with optional post-processing applied
 * @throws Error if Claude CLI is not available or fails
 */
/* v8 ignore next -- @preserve */
export function callClaude(options: CallClaudeOptions): string {
  const { prompt, input, cwd = process.cwd(), postProcess } = options;

  try {
    const result = execSync('claude -p', {
      cwd: resolve(cwd),
      input: `${prompt}\n\n${input}`,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });

    const output = result.trim();
    return postProcess ? postProcess(output) : output;
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      throw new Error(
        'Claude CLI not found. Please install it from https://github.com/anthropics/claude-cli'
      );
    }
    throw error;
  }
}

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

export interface CreateCommitOptions {
  /** The commit message to use */
  message: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
}

/**
 * Creates a git commit with the provided message.
 * @param options - Configuration options
 * @returns true on success, false on error
 */
export function createCommit(options: CreateCommitOptions): boolean {
  const { message, cwd = process.cwd() } = options;

  try {
    if (!isGitRepo(cwd)) {
      return false;
    }

    // Use -F - to read message from stdin to handle multiline messages properly
    execSync('git commit -F -', {
      cwd: resolve(cwd),
      input: message,
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a file has unstaged changes in git.
 * @param file - The file path to check (relative to cwd). If not provided, checks the entire repository.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns true if the file (or repository) has unstaged changes, false otherwise
 */
export function hasUnstagedChanges(
  file?: string,
  cwd: string = process.cwd()
): boolean {
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
    return false; // No changes
  } catch {
    return true; // Has changes
  }
}

/**
 * Gets the git status in porcelain format.
 * This is useful for comparing repository state before and after operations.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns The git status output, or null if not in a git repo
 */
/* v8 ignore next -- @preserve */
export function getGitStatus(cwd: string = process.cwd()): string | null {
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
  } catch {
    return null;
  }
}

export interface GetFilesInRangeOptions {
  /** The commit range to check (e.g., 'origin/main..HEAD', 'abc123..def456') */
  range: string;
  /** The directory to run git commands in. Defaults to process.cwd() */
  cwd?: string;
  /** Filter files by extension or pattern. Defaults to all files. */
  filter?: (file: string) => boolean;
}

/**
 * Gets the list of files that changed in a specific commit range.
 * This is useful for pre-push hooks to check only files being pushed.
 * @param options - Configuration options
 * @returns Array of file paths, or null if not in a git repo or on error
 */
export function getFilesInRange(
  options: GetFilesInRangeOptions
): string[] | null {
  const { range, cwd = process.cwd(), filter } = options;

  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);

    // Use git diff with --name-only and --diff-filter=ACMR to get only added/modified/renamed files
    const command = `git diff --name-only --diff-filter=ACMR ${escapeShellArg(range)}`;

    const result = execSync(command, {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    });

    // Split by newlines and filter out empty strings
    const files = result
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    // Apply optional filter
    return filter ? files.filter(filter) : files;
  } catch {
    return null;
  }
}

/**
 * Gets the list of files in commits that would be pushed to upstream.
 * Compares HEAD against the remote tracking branch (e.g., origin/feature-branch).
 * Equivalent to: git diff --name-only origin/$(git branch --show-current)..HEAD
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns Array of file paths, or null if not in a git repo or no upstream
 */
export function getFilesToPush(cwd: string = process.cwd()): string[] | null {
  try {
    if (!isGitRepo(cwd)) {
      return null;
    }

    const resolvedCwd = resolve(cwd);

    // Get current branch name
    const currentBranch = execSync('git branch --show-current', {
      cwd: resolvedCwd,
      stdio: 'pipe',
      encoding: 'utf-8',
    }).trim();

    if (!currentBranch) {
      return null;
    }

    // Construct the remote tracking branch (e.g., origin/feature-branch)
    const remoteBranch = `origin/${currentBranch}`;

    // Check if the remote branch exists
    try {
      execSync(`git rev-parse --verify ${escapeShellArg(remoteBranch)}`, {
        cwd: resolvedCwd,
        stdio: 'pipe',
      });
    } catch {
      // Remote branch doesn't exist
      return null;
    }

    // Get files in the range: origin/current-branch..HEAD
    return getFilesInRange({ range: `${remoteBranch}..HEAD`, cwd: resolvedCwd });
  } catch {
    return null;
  }
}
