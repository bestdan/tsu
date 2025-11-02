import { isGitRepo } from '../utils/git.js';
import { displayChangedFiles } from '../utils/command-helpers.js';

export interface GitChangedOptions {
  staged?: boolean;
  unstaged?: boolean;
  all?: boolean;
  baseBranch?: string;
  verbose?: boolean;
}

export function gitChanged(options: GitChangedOptions = {}): void {
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  displayChangedFiles(options);
}
