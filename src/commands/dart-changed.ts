import { getChangedFiles, isGitRepo, type ChangeType } from '../utils/git.js';
import { isDartPackage } from '../utils/dart.js';

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

  const baseBranch = options.baseBranch || 'main';
  const verbose = options.verbose || false;

  // Helper function to filter only Dart files
  const filterDartFiles = (files: string[]): string[] => {
    return files.filter((file) => file.endsWith('.dart'));
  };

  // Handle --all option
  if (options.all) {
    const committedFiles = getChangedFiles({
      type: 'committed',
      baseBranch,
    });
    const stagedFiles = getChangedFiles({ type: 'staged' });
    const unstagedFiles = getChangedFiles({ type: 'unstaged' });

    if (
      committedFiles === null ||
      stagedFiles === null ||
      unstagedFiles === null
    ) {
      console.error('Error: Failed to get changed files');
      process.exit(1);
    }

    // Filter to only Dart files
    const dartCommitted = filterDartFiles(committedFiles);
    const dartStaged = filterDartFiles(stagedFiles);
    const dartUnstaged = filterDartFiles(unstagedFiles);

    const totalChanges =
      dartCommitted.length + dartStaged.length + dartUnstaged.length;

    if (totalChanges === 0) {
      // Exit silently for pipe-friendliness
      return;
    }

    if (verbose) {
      // Verbose output with headers (to stderr to keep stdout clean)
      if (dartCommitted.length > 0) {
        console.error(
          `Committed Dart changes (compared to ${baseBranch}) (${dartCommitted.length}):`
        );
      }
      if (dartStaged.length > 0) {
        console.error(`Staged Dart changes (${dartStaged.length}):`);
      }
      if (dartUnstaged.length > 0) {
        console.error(`Unstaged Dart changes (${dartUnstaged.length}):`);
      }
    }

    // Output files to stdout with type prefix for --all
    dartCommitted.forEach((file) => {
      console.log(`committed:${file}`);
    });
    dartStaged.forEach((file) => {
      console.log(`staged:${file}`);
    });
    dartUnstaged.forEach((file) => {
      console.log(`unstaged:${file}`);
    });

    return;
  }

  // Determine which type of changes to show
  let type: ChangeType = 'committed';
  if (options.staged) {
    type = 'staged';
  } else if (options.unstaged) {
    type = 'unstaged';
  }

  const files = getChangedFiles({
    type,
    baseBranch,
  });

  if (files === null) {
    console.error('Error: Failed to get changed files');
    process.exit(1);
  }

  // Filter to only Dart files
  const dartFiles = filterDartFiles(files);

  if (dartFiles.length === 0) {
    // Exit silently for pipe-friendliness
    return;
  }

  if (verbose) {
    // Print header to stderr
    let header = '';
    if (type === 'committed') {
      header = `Changed Dart files compared to ${baseBranch} (${dartFiles.length}):`;
    } else if (type === 'staged') {
      header = `Staged Dart files (${dartFiles.length}):`;
    } else if (type === 'unstaged') {
      header = `Unstaged Dart files (${dartFiles.length}):`;
    }
    console.error(header);
  }

  // Output files to stdout, one per line
  dartFiles.forEach((file) => {
    console.log(file);
  });
}
