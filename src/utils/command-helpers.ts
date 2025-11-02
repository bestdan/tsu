import { getChangedFiles, type ChangeType } from './git.js';
import type { ChangedFilesOptions } from '../types/command-options.js';

/**
 * Checks a condition and exits with an error if the condition is false.
 * Useful for validating prerequisites like being in a git repo or Dart package.
 * @param condition - The condition to check
 * @param errorMessage - The error message to display if condition is false
 * @param options - Optional configuration
 * @param options.verbose - If true, logs a success message when condition is true
 * @param options.successMessage - Message to log when condition is true and verbose is enabled
 * @param options.exitCode - Exit code to use when condition is false (defaults to 1)
 * @example
 * ensureCondition(isGitRepo(), 'Error: Not in a git repository');
 * ensureCondition(isGitRepo(), 'Error: Not in a git repository', { verbose: true, successMessage: '✓ In git repository' });
 * ensureCondition(isDcmInstalled(), '⚠️  Warning: DCM not installed, skipping', { exitCode: 0 });
 */
export function ensureCondition(
  condition: boolean,
  errorMessage: string,
  options?: { verbose?: boolean; successMessage?: string; exitCode?: number }
): void {
  if (!condition) {
    if (errorMessage) {
      console.error(errorMessage);
    }
    process.exit(options?.exitCode ?? 1);
  }
  if (options?.verbose && options?.successMessage) {
    console.error(options.successMessage);
  }
}

/**
 * Options for displaying changed files
 */
export interface DisplayChangedFilesOptions extends ChangedFilesOptions {
  /** Optional filter function to filter files (e.g., only .dart files) */
  filter?: (file: string) => boolean;
  /** Optional prefix for the type in verbose output (e.g., "Dart") */
  typePrefix?: string;
}

/**
 * Gets changed files based on options, applying optional filters
 */
function getFilteredChangedFiles(
  type: ChangeType,
  baseBranch: string,
  filter?: (file: string) => boolean
): string[] | null {
  const files = getChangedFiles({ type, baseBranch });
  if (files === null) {
    return null;
  }
  return filter ? files.filter(filter) : files;
}

/**
 * Generic function to display changed files with consistent formatting.
 * Handles --all, --staged, --unstaged flags and verbose output.
 * Outputs files to stdout and headers to stderr.
 */
export function displayChangedFiles(options: DisplayChangedFilesOptions): void {
  const baseBranch = options.baseBranch || 'main';
  const verbose = options.verbose || false;
  const filter = options.filter;
  const typePrefix = options.typePrefix ? `${options.typePrefix} ` : '';

  // Handle --all option
  if (options.all) {
    const committedFiles = getFilteredChangedFiles(
      'committed',
      baseBranch,
      filter
    );
    const stagedFiles = getFilteredChangedFiles('staged', baseBranch, filter);
    const unstagedFiles = getFilteredChangedFiles(
      'unstaged',
      baseBranch,
      filter
    );

    if (
      committedFiles === null ||
      stagedFiles === null ||
      unstagedFiles === null
    ) {
      console.error('Error: Failed to get changed files');
      process.exit(1);
    }

    const totalChanges =
      committedFiles.length + stagedFiles.length + unstagedFiles.length;

    if (totalChanges === 0) {
      // Exit silently for pipe-friendliness
      return;
    }

    if (verbose) {
      // Verbose output with headers (to stderr to keep stdout clean)
      if (committedFiles.length > 0) {
        console.error(
          `Committed ${typePrefix}changes (compared to ${baseBranch}) (${committedFiles.length}):`
        );
      }
      if (stagedFiles.length > 0) {
        console.error(`Staged ${typePrefix}changes (${stagedFiles.length}):`);
      }
      if (unstagedFiles.length > 0) {
        console.error(
          `Unstaged ${typePrefix}changes (${unstagedFiles.length}):`
        );
      }
    }

    // Output files to stdout with type prefix for --all
    committedFiles.forEach((file) => {
      console.log(`committed:${file}`);
    });
    stagedFiles.forEach((file) => {
      console.log(`staged:${file}`);
    });
    unstagedFiles.forEach((file) => {
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

  const files = getFilteredChangedFiles(type, baseBranch, filter);

  if (files === null) {
    console.error('Error: Failed to get changed files');
    process.exit(1);
  }

  if (files.length === 0) {
    // Exit silently for pipe-friendliness
    return;
  }

  if (verbose) {
    // Print header to stderr
    let header = '';
    if (type === 'committed') {
      header = `Changed ${typePrefix}files compared to ${baseBranch} (${files.length}):`;
    } else if (type === 'staged') {
      header = `Staged ${typePrefix}files (${files.length}):`;
    } else if (type === 'unstaged') {
      header = `Unstaged ${typePrefix}files (${files.length}):`;
    }
    console.error(header);
  }

  // Output files to stdout, one per line
  files.forEach((file) => {
    console.log(file);
  });
}

/**
 * Gets changed files based on options and optional filter, without displaying them.
 * Useful for commands that need to process changed files further.
 */
export function getChangedFilesWithOptions(
  options: DisplayChangedFilesOptions
): string[] {
  const baseBranch = options.baseBranch || 'main';
  const filter = options.filter;

  if (options.all) {
    const committedFiles = getFilteredChangedFiles(
      'committed',
      baseBranch,
      filter
    );
    const stagedFiles = getFilteredChangedFiles('staged', baseBranch, filter);
    const unstagedFiles = getFilteredChangedFiles(
      'unstaged',
      baseBranch,
      filter
    );

    if (
      committedFiles === null ||
      stagedFiles === null ||
      unstagedFiles === null
    ) {
      console.error('Error: Failed to get changed files');
      process.exit(1);
    }

    // Combine all changed files and deduplicate
    const allFiles = [...committedFiles, ...stagedFiles, ...unstagedFiles];
    return Array.from(new Set(allFiles));
  }

  // Determine which type of changes to show
  let type: ChangeType = 'committed';
  if (options.staged) {
    type = 'staged';
  } else if (options.unstaged) {
    type = 'unstaged';
  }

  const files = getFilteredChangedFiles(type, baseBranch, filter);
  if (files === null) {
    console.error('Error: Failed to get changed files');
    process.exit(1);
  }

  return files;
}
