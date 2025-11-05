import { execSync } from 'node:child_process';
import {
  isGitRepo,
  hasUnstagedChanges,
} from '../../../git/utils/git.js';
import {
  isDartPackage,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../../../dart/utils/dart.js';
import { filterFilesBySuffix } from '../../../files/utils/files.js';
import { escapeShellArg } from '../../../../utils/shell.js';
import {
  ensureCondition,
  ensureDCMInstalled,
  getHookChangedFiles,
  displayFileList,
} from '../../../../utils/command-helpers.js';
import { logIfVerbose } from '../../../../utils/logger.js';

export interface DartHookDcmCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from DCM checks. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
  files?: string[];
}

/**
 * Runs DCM fix on Dart files and checks if fixes created changes.
 * Supports two modes:
 * 1. Explicit file list (--files)
 * 2. Default mode - checks all changed files
 *
 * Steps:
 * 1. Checks if DCM is installed
 * 2. Gets modified Dart files (excluding generated files)
 * 3. Runs dcm fix on them
 * 4. Checks if fixes created any changes
 * 5. Exits with error if files were modified by DCM
 */
export function dartHookDcmCheck(
  options: DartHookDcmCheckOptions = {}
): void {
  const verbose = options.verbose || false;
  const excludeSuffixes = options.excludeSuffixes || [
    ...COMMON_DART_CODEGEN_SUFFIXES,
  ];

  // Check if DCM is installed
  ensureDCMInstalled(verbose);

  logIfVerbose(verbose, '🔧 Running DCM fix on modified files...');

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get files to check (explicit or changed files)
  const allFiles = getHookChangedFiles({ files: options.files, verbose, cwd });

  // Filter to only Dart files
  const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));

  // Filter out generated files
  const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);

  if (modifiedFiles.length === 0) {
    logIfVerbose(verbose, '✓ No Dart source files modified');
    process.exit(0);
  }

  // Display files being checked in verbose mode
  displayFileList({
    files: modifiedFiles,
    verbose,
    message: 'Running DCM fix on',
  });

  // Run dcm fix on the files
  /* v8 ignore next -- @preserve */
  try {
    const fileArgs = modifiedFiles.map(escapeShellArg).join(' ');
    execSync(`dcm fix ${fileArgs}`, {
      cwd,
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Error: Failed to run dcm fix');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  // Check if DCM fixes created changes in the files we fixed
  /* v8 ignore next -- @preserve */
  const filesWithChanges = modifiedFiles.filter((file) =>
    hasUnstagedChanges(file, cwd)
  );

  /* v8 ignore next -- @preserve */
  if (filesWithChanges.length > 0) {
    console.error('');
    console.error(
      '❌ Push blocked: DCM fixes were applied. Please stage and commit these changes:'
    );
    filesWithChanges.forEach((file) => {
      console.error(file);
    });
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ All files pass DCM checks');
  process.exit(0);
}
