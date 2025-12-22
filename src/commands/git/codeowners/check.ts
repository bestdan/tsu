import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus } from '../utils/git.js';
import { ensureCondition } from '../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
import type { CheckCommandOptions } from '../../../types/command-options.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitCodeownersCheckOptions extends CheckCommandOptions {}

/**
 * Checks if CODEOWNERS files are in sync and if there are any unowned files.
 *
 * Steps:
 * 1. Checks if coach is installed
 * 2. Saves git status before running coach
 * 3. Runs coach codeowners generate
 * 4. Checks if any CODEOWNERS files changed
 * 5. Exits with error if files were modified
 * 6. Runs coach codeowners unowned --check
 * 7. Exits with error if there are unowned files
 */
export function gitCodeownersCheck(options: GitCodeownersCheckOptions = {}): void {
  const verbose = options.verbose || false;

  logIfVerbose(verbose, '🔍 Checking CODEOWNERS files...');

  // Check we're in a git repo
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');

  const cwd = process.cwd();

  // Check if coach is installed
  ensureCondition(
    isCommandInstalled('coach'),
    verbose ? '⚠️  Warning: coach not installed, skipping' : '',
    { exitCode: 0 }
  );

  // Get git status before running coach
  const gitStatusBefore = getGitStatus(cwd);

  ensureCondition(gitStatusBefore !== null, 'Error: Failed to get git status');

  logIfVerbose(verbose, '🔧 Running coach codeowners generate...');

  /* v8 ignore next -- @preserve */
  // Run coach codeowners generate
  try {
    execSync('coach codeowners generate', {
      cwd,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  } catch (error) {
    console.error('Error: Failed to run coach codeowners generate');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  // Get git status after running coach
  /* v8 ignore next -- @preserve */
  const gitStatusAfter = getGitStatus(cwd);

  /* v8 ignore next -- @preserve */
  ensureCondition(gitStatusAfter !== null, 'Error: Failed to get git status');

  // Compare git status before and after
  // TypeScript knows these are non-null after ensureCondition checks
  // Using type guards instead of assertions for better safety
  /* v8 ignore next -- @preserve */
  if (gitStatusBefore && gitStatusAfter && gitStatusBefore !== gitStatusAfter) {
    console.error('');
    console.error('❌ CODEOWNERS files are out of sync!');
    console.error(
      "Please run 'coach codeowners generate' locally and commit the changes to your branch."
    );
    console.error('');
    console.error('Modified files:');

    // Show what changed by comparing git status outputs
    /* v8 ignore next -- @preserve */
    try {
      // Parse the status outputs to show what changed
      const beforeLines = new Set(gitStatusBefore.split('\n').filter((line) => line.length > 0));
      const afterLines = gitStatusAfter.split('\n').filter((line) => line.length > 0);

      // Find files that are new or have different status
      const changedFiles = afterLines.filter((line) => !beforeLines.has(line));

      if (changedFiles.length > 0) {
        changedFiles.forEach((line) => {
          // Extract just the filename from the porcelain format (e.g., "?? file" or "M  file")
          const match = line.match(/^..\s+(.+)$/);
          if (match && match[1]) {
            console.error(`   ${match[1]}`);
          }
        });
      } else {
        console.error('   (Unable to determine changed files)');
      }
    } catch {
      // If parsing fails, just show a generic message
      console.error('   (Unable to determine changed files)');
    }

    console.error('');
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ CODEOWNERS files are in sync');

  // Check for unowned files
  logIfVerbose(verbose, '🔍 Checking for unowned files...');

  /* v8 ignore next -- @preserve */
  try {
    execSync('coach codeowners unowned --check', {
      cwd,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  } catch {
    console.error('');
    console.error('❌ There are unowned files in the repository!');
    console.error('Please add the necessary OWNERSHIP files to appropriately tag owners.');
    console.error('');
    process.exit(1);
  }

  logIfVerbose(verbose, '✅ No unowned files detected!');
  process.exit(0);
}
