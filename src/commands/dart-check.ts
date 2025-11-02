import { isDartPackage } from '../utils/dart.js';
import type { CheckCommandOptions } from '../types/command-options.js';

export interface DartCheckOptions extends CheckCommandOptions {}

/**
 * Check if current directory is in a Dart package (exit code only)
 */
export function dartCheck(
  path: string | undefined,
  options: DartCheckOptions
): void {
  const cwd = path || process.cwd();
  const isPackage = isDartPackage(cwd);

  if (options.verbose) {
    if (isPackage) {
      console.error('✓ Inside a Dart package');
    } else {
      console.error('✗ Not inside a Dart package');
    }
  }

  process.exit(isPackage ? 0 : 1);
}
