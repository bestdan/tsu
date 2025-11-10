import { isGitRepo, getStagedDiff, generateCommitMessage, createCommit } from './utils/git.js';

import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
import type { BaseCommandOptions } from '../../types/command-options.js';
import { logIfVerbose } from '../../utils/logger.js';

export interface GitCommitMsgOptions extends BaseCommandOptions {
  /** Automatically create the commit with generated message */
  commit?: boolean;
}

export function gitCommitMsg(options: GitCommitMsgOptions = {}): void {
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  ensureClaudeInstalled();

  const verbose = options.verbose || false;

  // Check if there are staged changes
  const diff = getStagedDiff();
  if (!diff) {
    console.error('Error: No changes staged for commit. Use "git add" first.');
    process.exit(1);
  }

  logIfVerbose(verbose, 'Generating commit message with Claude...');

  // Generate commit message
  let message: string | null;
  try {
    message = generateCommitMessage();
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Error: Failed to generate commit message');
    }
    process.exit(1);
  }

  if (!message) {
    console.error('Error: Failed to generate commit message');
    process.exit(1);
  }

  // If --commit flag is set, create the commit
  if (options.commit) {
    logIfVerbose(verbose, 'Creating commit...');

    const success = createCommit({ message });
    if (!success) {
      console.error('Error: Failed to create commit');
      process.exit(1);
    }

    logIfVerbose(verbose, 'Commit created successfully!');

    // Output the message to stdout for visibility
    console.log(message);
  } else {
    // Output message to stdout for piping or review
    console.log(message);
  }
}
