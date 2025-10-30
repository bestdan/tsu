import { findDartPackageRoot } from '../utils/dart.js';

export interface DartRootOptions {
  verbose?: boolean;
}

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
    if (options.verbose) {
      console.error('✗ Not inside a Dart package');
    }
    process.exit(1);
  }
}
