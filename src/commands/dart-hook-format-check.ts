import { execSync } from 'node:child_process';
import { isGitRepo, getChangedFiles } from '../utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';

export interface DartHookFormatCheckOptions {
  verbose?: boolean;
}

/**
 * Checks if a file has unstaged changes in git.
 * @param file - The file path to check
 * @param cwd - The directory to run git commands in
 * @returns true if the file has unstaged changes, false otherwise
 */
function hasUnstagedChanges(file: string, cwd: string): boolean {
  try {
    execSync(`git diff --quiet "${file}"`, {
      cwd,
      stdio: 'pipe',
    });
    return false; // No changes
  } catch {
    return true; // Has changes
  }
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
  const committedFiles = getChangedFiles({ type: 'committed' }) || [];
  const stagedFiles = getChangedFiles({ type: 'staged' }) || [];
  const unstagedFiles = getChangedFiles({ type: 'unstaged' }) || [];

  // Combine all changed files and remove duplicates
  const allChangedFiles = Array.from(
    new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])
  );

  // Filter to only Dart files
  const dartFiles = allChangedFiles.filter((file) => file.endsWith('.dart'));

  // Filter out generated files
  const generatedSuffixes = [
    '.g.dart',
    '.freezed.dart',
    '.gql.dart',
    '.fakes.dart',
    '.golden.dart',
  ];
  const modifiedFiles = filterFilesBySuffix(dartFiles, generatedSuffixes);

  if (modifiedFiles.length === 0) {
    if (verbose) {
      console.error('✓ No Dart source files modified');
    }
    process.exit(0);
  }

  // Format the files
  try {
    const fileArgs = modifiedFiles.map((f) => `"${f}"`).join(' ');
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
  const filesWithChanges: string[] = [];
  for (const file of modifiedFiles) {
    if (hasUnstagedChanges(file, cwd)) {
      filesWithChanges.push(file);
    }
  }

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
