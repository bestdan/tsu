import { resolve } from 'node:path';
import { isGitRepo } from '../../git/utils/git.js';
import {
  findDartPackageRoot,
  findAllDartFiles,
  buildDependencyGraph,
  buildReverseDependencyGraph,
  findDownstreamDependencies,
  findFilePackageRoot,
} from '../utils/dart.js';
import { getChangedFilesWithOptions } from '../../../utils/command-helpers.js';
import type { ChangedFilesOptions } from '../../../types/command-options.js';

export interface DartChangedDownstreamOptions extends ChangedFilesOptions {
  /** Output relative paths instead of absolute paths */
  relative?: boolean;
}

/**
 * Find all Dart files that depend on changed Dart files (downstream dependencies)
 */
export function dartChangedDownstream(
  options: DartChangedDownstreamOptions = {}
): void {
  // Check we're in both a git repo and a Dart package
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  const packageRoot = findDartPackageRoot();
  if (!packageRoot) {
    console.error('Error: Not in a Dart package');
    process.exit(1);
  }

  const verbose = options.verbose || false;

  // Get changed Dart files using the shared helper
  const changedDartFiles = getChangedFilesWithOptions({
    ...options,
    filter: (file) => file.endsWith('.dart'),
  });

  if (changedDartFiles.length === 0) {
    if (verbose) {
      console.error('No changed Dart files found');
    }
    return;
  }

  // Resolve to absolute paths
  const cwd = process.cwd();
  const absoluteChangedFiles = changedDartFiles.map((file) =>
    resolve(cwd, file)
  );

  if (verbose) {
    console.error(`Found ${changedDartFiles.length} changed Dart file(s)`);
    console.error('Finding all Dart files in package...');
  }

  // Find all Dart files in the package
  const allDartFiles = findAllDartFiles(packageRoot);
  if (!allDartFiles || allDartFiles.length === 0) {
    console.error('Error: No Dart files found in package');
    process.exit(1);
  }

  if (verbose) {
    console.error(`Found ${allDartFiles.length} total Dart files`);
  }

  // Determine which package the changed files belong to
  // For simplicity, we'll use the first changed file's package
  const firstChangedFile = absoluteChangedFiles[0];
  if (!firstChangedFile) {
    console.error('Error: No changed files found');
    process.exit(1);
  }
  const targetPackageRoot = findFilePackageRoot(firstChangedFile, packageRoot);

  if (verbose) {
    console.error(`Target package: ${targetPackageRoot}`);
  }

  // Filter to only files in the same package
  const packageFiles = allDartFiles.filter((file) =>
    file.startsWith(targetPackageRoot)
  );

  if (verbose) {
    console.error(`Found ${packageFiles.length} Dart files in target package`);
    console.error('Building dependency graph...');
  }

  // Build dependency graphs
  const dependencyGraph = buildDependencyGraph(packageFiles, packageRoot);
  const reverseGraph = buildReverseDependencyGraph(dependencyGraph);

  if (verbose) {
    console.error('Finding downstream dependencies...');
  }

  // Find downstream dependencies
  const downstream = findDownstreamDependencies(
    absoluteChangedFiles,
    reverseGraph
  );

  if (downstream.size === 0) {
    if (verbose) {
      console.error('No downstream dependencies found');
    }
    return;
  }

  if (verbose) {
    console.error(`Found ${downstream.size} downstream dependencies`);
  }

  // Convert to array and sort for consistent output
  const sortedDownstream = Array.from(downstream).sort();

  // Output paths
  for (const file of sortedDownstream) {
    if (options.relative) {
      console.log(file.replace(packageRoot + '/', ''));
    } else {
      console.log(file);
    }
  }
}
