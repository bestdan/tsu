import {
  isGitRepo,
} from '../../../git/utils/git.js';
import {
  isDartPackage,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../../../dart/utils/dart.js';
import { filterFilesBySuffix } from '../../../files/utils/files.js';
import {
  ensureCondition,
  ensureDCMInstalled,
  getHookChangedFiles,
  displayFileList,
} from '../../../../utils/command-helpers.js';
import { logIfVerbose } from '../../../../utils/logger.js';
import { dcmAnalyze } from '../../../../utils/dcm-parse.js';

export interface DartHookDcmAnalyzeCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from DCM checks. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
  files?: string[];
}

/**
 * Runs DCM analyze on Dart files and checks for issues.
 * Supports two modes:
 * 1. Explicit file list (--files)
 * 2. Default mode - checks all changed files
 *
 * Steps:
 * 1. Checks if DCM is installed
 * 2. Gets modified Dart files (excluding generated files)
 * 3. Runs dcm analyze on them
 * 4. Exits with error if DCM analyze reports any issues
 */
export function dartHookDcmAnalyzeCheck(
  options: DartHookDcmAnalyzeCheckOptions = {}
): void {
  const verbose = options.verbose || false;
  const excludeSuffixes = options.excludeSuffixes || [
    ...COMMON_DART_CODEGEN_SUFFIXES,
  ];

  // Check if DCM is installed
  ensureDCMInstalled(verbose);

  logIfVerbose(verbose, '🔍 Running DCM analyze on modified files...');

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
    message: 'Running DCM analyze on',
  });

  // Run dcm analyze on the files
  const result = dcmAnalyze({ cwd, timeout: 20000, files: modifiedFiles });

  if (!result.success) {
    const filesWithIssues = result.filesWithIssues;

    console.error('');
    console.error('❌ Push blocked: DCM analyze found issues in the following file(s):');
    filesWithIssues.forEach((file) => {
      console.error(`  ${file}`);
    });
    console.error('');
    console.error('Run `dcm fix` to fix the issues.');
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ All files pass DCM analyze checks');
  process.exit(0);
}
