
import { isGitRepo, generatePRDescription } from './utils/git.js';
import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
import type { BaseCommandOptions } from '../../types/command-options.js';

export interface GitPRDescriptionOptions extends BaseCommandOptions {
  /** Base branch to compare against (default: 'main') */
  baseBranch?: string;
}

export function gitPRDescription(options: GitPRDescriptionOptions = {}): void {
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  ensureClaudeInstalled();

  const baseBranch = options.baseBranch || 'main';
  const verbose = options.verbose || false;

  if (verbose) {
    console.error(
      `Generating PR description comparing to ${baseBranch} branch...`
    );
  }

  // Generate PR description
  let description: string | null;
  try {
    description = generatePRDescription({ baseBranch });
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);
    } else {
      console.error('Error: Failed to generate PR description');
    }
    process.exit(1);
  }

  if (!description) {
    console.error('Error: Failed to generate PR description');
    process.exit(1);
  }

  // Output description to stdout
  console.log(description);
}
