import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { findDartPackageRoot, findFilePackageRoot } from './utils/dart.js';
import type { GetValueCommandOptions } from '../../types/command-options.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DartPackageOptions extends GetValueCommandOptions {}

/**
 * Get the package root that contains a specific file (useful in mono-repos)
 */
export function dartPackage(filePath: string, options: DartPackageOptions): void {
  const absolutePath = resolve(filePath);

  if (!existsSync(absolutePath)) {
    if (options.verbose) {
      console.error(`✗ File not found: ${filePath}`);
    }
    process.exit(1);
  }

  // First find the workspace root
  const workspaceRoot = findDartPackageRoot(absolutePath);
  if (!workspaceRoot) {
    if (options.verbose) {
      console.error('✗ Not inside a Dart package');
    }
    process.exit(1);
  }

  // Then find the specific package containing this file
  const packageRoot = findFilePackageRoot(absolutePath, workspaceRoot);

  if (options.verbose) {
    console.error(`Package root for ${filePath}:`);
  }

  console.log(packageRoot);
  process.exit(0);
}
