import { findDartPackageRoot } from './utils/dart.js';
import type { GetValueCommandOptions } from '../../types/command-options.js';
import { logError } from '../../utils/error-logger.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DartRootOptions extends GetValueCommandOptions {}

/**
 * Get the root directory of the Dart package
 */
export function dartRoot(path: string | undefined, options: DartRootOptions): void {
  const cwd = path || process.cwd();
  const root = findDartPackageRoot(cwd);

  if (options.verbose) {
    console.error('Dart package root:');
  }

  if (root) {
    console.log(root);
    process.exit(0);
  } else {
    const error = new Error('Not inside a Dart package');
    logError(error, `tsu dart root${path ? ` ${path}` : ''}`);
    if (options.verbose) {
      console.error('✗ Not inside a Dart package');
    }
    process.exit(1);
  }
}
