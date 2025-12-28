import { isGitRepo } from './utils/git.js';
import { displayChangedFiles } from '../../utils/command-helpers.js';
import type { ChangedFilesOptions } from '../../types/command-options.js';
import { logError } from '../../utils/error-logger.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitChangedOptions extends ChangedFilesOptions {}

export function gitChanged(options: GitChangedOptions = {}): void {
  if (!isGitRepo()) {
    const error = new Error('Not in a git repository');
    logError(error, 'tsu git changed');
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  displayChangedFiles(options);
}
