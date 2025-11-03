import { execSync } from 'node:child_process';
import {
  isGitRepo,
  getAllChangedFiles,
  hasUnstagedChanges,
} from '../../../git/utils/git.js';
import {
  isDartPackage,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../../utils/dart.js';
import { filterFilesBySuffix } from '../../../files/utils/files.js';
import { escapeShellArg } from '../../../../utils/shell.js';
import { logIfVerbose } from '../../../../utils/logger.js';
import { hasExplicitFiles } from '../../../../utils/command-helpers.js';

export interface DartHookFormatCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from formatting. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
  files?: string[];
}

/**
 * Formats Dart files and checks if formatting created changes.
 * Supports two modes:
 * 1. Explicit file list (--files)
 * 2. Default mode - checks all changed files
 *
 * Steps:
 * 1. Gets modified Dart files (excluding generated files)
 * 2. Formats them with dart format
 * 3. Checks if formatting created any changes
 * 4. Exits with error if files were formatted
 */
export function dartHookFormatCheck(
  options: DartHookFormatCheckOptions = {}
): void {
  const verbose = options.verbose || false;
  const excludeSuffixes = options.excludeSuffixes || [
    ...COMMON_DART_CODEGEN_SUFFIXES,
  ];

  logIfVerbose(verbose, '🎨 Running dart format on modified files...');

  // Check we're in both a git repo and a Dart package
  if (!isGitRepo()) {
    console.error('Error: Not in a git repository');
    process.exit(1);
  }

  if (!isDartPackage()) {
    console.error('Error: Not in a Dart package');
    process.exit(1);
  }

  const cwd = process.cwd();

  let allFiles: string[];

  // Determine which files to check
  if (hasExplicitFiles(options.files)) {
    // Mode 1: Explicit file list provided
    logIfVerbose(verbose, 'Using provided files');
    allFiles = options.files;
  } else {
    // Mode 2: Default - check all changed files
    logIfVerbose(verbose, 'Checking all changed files');
    allFiles = getAllChangedFiles(cwd);
  }

  // Filter to only Dart files
  const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));

  // Filter out generated files
  const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);

  if (modifiedFiles.length === 0) {
    logIfVerbose(verbose, '✓ No Dart source files modified');
    process.exit(0);
  }

  // Format the files
  /* v8 ignore next -- @preserve */
  try {
    const fileArgs = modifiedFiles.map(escapeShellArg).join(' ');
    execSync(`dart format ${fileArgs}`, {
      cwd,
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Error: Failed to run dart format');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  // Check if formatting created changes in the files we formatted
  /* v8 ignore next -- @preserve */
  const filesWithChanges = modifiedFiles.filter((file) =>
    hasUnstagedChanges(file, cwd)
  );

  /* v8 ignore next -- @preserve */
  if (filesWithChanges.length > 0) {
    console.error('');
    console.error(
      '❌ Push blocked: Files were formatted. Please stage and commit these changes:'
    );
    filesWithChanges.forEach((file) => {
      console.error(file);
    });
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ All files properly formatted');
  process.exit(0);
}
