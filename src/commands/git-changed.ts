import { isGitRepo } from '../utils/git.js';
import { displayChangedFiles } from '../utils/command-helpers.js';
import type { ChangedFilesOptions } from '../types/command-options.js';

export interface GitChangedOptions extends ChangedFilesOptions {}

export function gitChanged(options: GitChangedOptions = {}): void {
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  displayChangedFiles(options);
}
