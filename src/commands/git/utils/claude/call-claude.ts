import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

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
