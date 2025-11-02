import { isGitRepo } from '../utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { displayChangedFiles } from '../utils/command-helpers.js';

export interface DartChangedOptions {
  staged?: boolean;
  unstaged?: boolean;
  all?: boolean;
  baseBranch?: string;
  verbose?: boolean;
}

/**
 * Show Dart files that have changed
 */
export function dartChanged(options: DartChangedOptions = {}): void {
  // Check we're in both a git repo and a Dart package
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  if (!isDartPackage()) {
    console.error('Error: Not in a Dart package');
    process.exit(1);
  }

  displayChangedFiles({
    ...options,
    filter: (file) => file.endsWith('.dart'),
    typePrefix: 'Dart',
  });
}
