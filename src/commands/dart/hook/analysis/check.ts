import { execSync } from 'node:child_process';
import {
  isGitRepo,
} from '../../../git/utils/git.js';
import {
  isDartPackage,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../../utils/dart.js';
import { filterFilesBySuffix } from '../../../files/utils/files.js';
import {
  ensureCondition,
  getHookChangedFiles,
  displayFileList,
} from '../../../../utils/command-helpers.js';
import { logIfVerbose } from '../../../../utils/logger.js';

export interface DartHookAnalysisCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from analysis. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
  files?: string[];
}

/**
 * Runs dart analyze on the Dart package when Dart files are modified.
 * Supports two modes:
 * 1. Explicit file list (--files) - checks if any provided files are Dart files
 * 2. Default mode - checks if any changed files are Dart files
 *
 * Steps:
 * 1. Gets modified Dart files (excluding generated files) to determine if analysis is needed
 * 2. Runs dart analyze --fatal-infos on the entire package if Dart files are present
 * 3. Exits with error if analysis fails
 *
 * Note: dart analyze operates at the package level, not per-file. The file filtering
 * is used only to determine whether analysis is necessary.
 */
export function dartHookAnalysisCheck(
  options: DartHookAnalysisCheckOptions = {}
): void {
  const verbose = options.verbose || false;
  const excludeSuffixes = options.excludeSuffixes || [
    ...COMMON_DART_CODEGEN_SUFFIXES,
  ];

  logIfVerbose(verbose, '🔍 Running dart analyze on modified files...');

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
  // Note: dart analyze operates at package level, but we show which files triggered it
  displayFileList({
    files: modifiedFiles,
    verbose,
    message: 'Running dart analyze (triggered by)',
  });

  // Run dart analyze --fatal-infos on the package
  /* v8 ignore next -- @preserve */
  try {
    execSync(`dart analyze . --fatal-infos --fatal-warnings`, {
      cwd,
      stdio: 'pipe',
    });
  } catch (error) {
    console.error('Error: Dart analyze failed');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ All files pass dart analyze');
  process.exit(0);
}
