import { execSync } from 'node:child_process';
import { isGitRepo, getAllChangedFiles } from '../../git/utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES } from '../../dart/utils/dart.js';
import { filterFilesBySuffix } from '../../files/utils/files.js';
import { escapeShellArg } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
import { ensureCondition, displayFileList } from '../../../utils/command-helpers.js';
import type { ChangedFilesOptions } from '../../../types/command-options.js';
import { setVerbose } from '../../../utils/verbose-state.js';

export interface DartHookFormatCheckOptions extends ChangedFilesOptions {
  /** Suffixes to exclude from formatting. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
}

/**
 * Checks if Dart files would be reformatted.
 * Gets changed files based on options (staged, unstaged, all, or committed changes).
 *
 * Steps:
 * 1. Gets modified Dart files (excluding generated files)
 * 2. Runs dart format with --output=none --set-exit-if-changed
 * 3. Exits with code 0 if files are properly formatted, 1 if they would be reformatted
 * 4. Lists files that would be reformatted in verbose mode
 */
export function dartHookFormatCheck(options: DartHookFormatCheckOptions = {}): void {
  const verbose = options.verbose || false;
  const excludeSuffixes = options.excludeSuffixes || [...COMMON_DART_CODEGEN_SUFFIXES];

  // Set global verbose state for downstream functions
  setVerbose(verbose);

  logIfVerbose(verbose, '🎨 Checking dart format on modified files...');

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get files to check based on options
  const allFiles = getAllChangedFiles(options, cwd);

  // Filter to only Dart files
  const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));

  // Filter out generated files
  const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);

  if (modifiedFiles.length === 0) {
    logIfVerbose(verbose, '✓ No Dart source files modified');
    console.log(0);
    process.exit(0);
  }

  // Display files being checked in verbose mode
  displayFileList({
    files: modifiedFiles,
    verbose,
    message: 'Checking dart format on',
  });

  // Check if files would be reformatted using dart format's exit code
  /* v8 ignore next -- @preserve */
  try {
    const fileArgs = modifiedFiles.map(escapeShellArg).join(' ');
    execSync(`dart format --output=none --set-exit-if-changed ${fileArgs}`, {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
    });

    // Exit code 0 means no files would be reformatted
    logIfVerbose(verbose, '✓ All files properly formatted');
    console.log(0);
    process.exit(0);
  } catch (error: unknown) {
    // Exit code 1 means files would be reformatted
    if (error instanceof Error && 'status' in error && (error as { status: number }).status === 1) {
      const output = 'stdout' in error ? (error as { stdout: Buffer }).stdout.toString() : '';

      if (verbose) {
        console.error('');
        console.error(
          '❌ Files would be reformatted. Please run dart format and commit these changes:'
        );
        if (output) {
          console.error(output);
        }
      }

      console.log(1);
      process.exit(1);
    }

    // Any other error means dart format failed
    console.error('Error: Failed to run dart format');
    if (error instanceof Error) {
      console.error(error.message);
    }
    console.log(1);
    process.exit(1);
  }
}
