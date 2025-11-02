import { execSync } from 'node:child_process';
import {
  isGitRepo,
  getAllChangedFiles,
  hasUnstagedChanges,
} from '../utils/git.js';
import {
  isDartPackage,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { escapeShellArg, isCommandInstalled } from '../utils/shell.js';
import { ensureCondition } from '../utils/command-helpers.js';

export interface DartHookDcmCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from DCM checks. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
}

/**
 * Runs DCM fix on Dart files and checks if fixes created changes.
 * This replicates the functionality of a pre-push hook that:
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
  if (!isCommandInstalled('dcm')) {
    if (verbose) {
      console.error('⚠️  Warning: DCM not installed, skipping');
    }
    process.exit(0);
  }

  if (verbose) {
    console.error('🔧 Running DCM fix on modified files...');
  }

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get all changed Dart files (committed, staged, and unstaged)
  const allChangedFiles = getAllChangedFiles(cwd);

  // Filter to only Dart files
  const dartFiles = allChangedFiles.filter((file) => file.endsWith('.dart'));

  // Filter out generated files
  const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);

  if (modifiedFiles.length === 0) {
    if (verbose) {
      console.error('✓ No Dart source files modified');
    }
    process.exit(0);
  }

  // Log the files being checked in verbose mode
  if (verbose) {
    console.error(`Running DCM fix on ${modifiedFiles.length} file(s):`);
    modifiedFiles.forEach((file) => {
      console.error(`  ${file}`);
    });
  }

  // Run dcm fix on the files
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
  const filesWithChanges = modifiedFiles.filter((file) =>
    hasUnstagedChanges(file, cwd)
  );

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

  if (verbose) {
    console.error('✓ All files pass DCM checks');
  }
  process.exit(0);
}
