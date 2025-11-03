import { isGitRepo } from '../../git/utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { displayChangedFiles } from '../../../utils/command-helpers.js';
import type { ChangedFilesOptions } from '../../../types/command-options.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DartChangedOptions extends ChangedFilesOptions {}

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
