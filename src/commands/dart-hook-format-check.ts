import { execSync } from 'node:child_process';
import {
  isGitRepo,
  getChangedFiles,
  hasUnstagedChanges,
} from '../utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { escapeShellArg } from '../utils/shell.js';

/**
 * Common Dart code generation file suffixes.
 * These files are typically auto-generated and should be excluded from formatting checks.
 */
export const COMMON_DART_CODEGEN_SUFFIXES = [
  '.g.dart',
  '.freezed.dart',
  '.gql.dart',
  '.fakes.dart',
  '.golden.dart',
] as const;

export interface DartHookFormatCheckOptions {
  verbose?: boolean;
  /** Suffixes to exclude from formatting. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
}

/**
 * Gets all changed files (committed, staged, and unstaged) combined into a single unique list.
 * @param cwd - The directory to run git commands in
 * @returns Array of unique file paths
 */
function getAllChangedFiles(cwd: string): string[] {
  const committedFiles = getChangedFiles({ type: 'committed', cwd }) || [];
  const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
  const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];

  // Combine all changed files and remove duplicates
  return Array.from(
    new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])
  );
}

/**
 * Formats Dart files and checks if formatting created changes.
 * This replicates the functionality of a pre-push hook that:
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

  if (verbose) {
    console.error('🎨 Running dart format on modified files...');
  }

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

  // Format the files
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
  const filesWithChanges = modifiedFiles.filter((file) =>
    hasUnstagedChanges(file, cwd)
  );

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

  if (verbose) {
    console.error('✓ All files properly formatted');
  }
  process.exit(0);
}
