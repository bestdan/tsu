import {
  isGitRepo,
  getStagedDiff,
  generateCommitMessage,
  createCommit,
} from '../utils/git.js';

export interface GitCommitMsgOptions {
  commit?: boolean;
  verbose?: boolean;
}

export function gitCommitMsg(options: GitCommitMsgOptions = {}): void {
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  const verbose = options.verbose || false;

  // Check if there are staged changes
  const diff = getStagedDiff();
  if (!diff) {
    console.error('Error: No changes staged for commit. Use "git add" first.');
    process.exit(1);
  }

  if (verbose) {
    console.error('Generating commit message with Claude...');
  }

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
    if (verbose) {
      console.error('Creating commit...');
    }

    const success = createCommit({ message });
    if (!success) {
      console.error('Error: Failed to create commit');
      process.exit(1);
    }

    if (verbose) {
      console.error('Commit created successfully!');
    }
    // Output the message to stdout for visibility
    console.log(message);
  } else {
    // Output message to stdout for piping or review
    console.log(message);
  }
}
