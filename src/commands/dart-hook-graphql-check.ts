import { execSync } from 'node:child_process';
import {
  isGitRepo,
  getAllChangedFiles,
  getGitStatus,
} from '../utils/git.js';
import { isDartPackage } from '../utils/dart.js';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled } from '../utils/shell.js';

export interface DartHookGraphqlCheckOptions {
  verbose?: boolean;
}

/**
 * Checks if GraphQL files are modified and runs code generation to verify fakes are up to date.
 * This replicates the functionality of a pre-push hook that:
 * 1. Checks if melos is installed
 * 2. Gets modified .graphql files
 * 3. Saves git status before running codegen
 * 4. Runs GraphQL code generation (melos run codegen:graphql:test)
 * 5. Checks if codegen created any changes
 * 6. Exits with error if files were modified by codegen
 */
export function dartHookGraphqlCheck(
  options: DartHookGraphqlCheckOptions = {}
): void {
  const verbose = options.verbose || false;
  const codegenCommand = 'melos run codegen:graphql:test';

  if (verbose) {
    console.error('🧪 Checking for modified GraphQL files...');
  }

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get all changed files (committed, staged, and unstaged)
  const allChangedFiles = getAllChangedFiles(cwd);

  // Filter to only GraphQL files
  const graphqlFiles = allChangedFiles.filter((file) =>
    file.endsWith('.graphql')
  );

  ensureCondition(
    graphqlFiles.length > 0,
    verbose ? '✓ No GraphQL files modified (skipping)' : '',
    { exitCode: 0 }
  );

  if (verbose) {
    console.error(`📝 Found modified GraphQL files: ${graphqlFiles.length}`);
    graphqlFiles.forEach((file) => {
      console.error(`  ${file}`);
    });
  }

  // Check if melos is installed
  ensureCondition(
    isCommandInstalled('melos'),
    verbose ? '⚠️  Warning: Melos not installed, skipping' : '',
    { exitCode: 0 }
  );

  // Get git status before running codegen
  const gitStatusBefore = getGitStatus(cwd);

  ensureCondition(
    gitStatusBefore !== null,
    'Error: Failed to get git status'
  );

  if (verbose) {
    console.error('🔧 Running GraphQL code generation...');
  }

  // Run the code generation command
  try {
    execSync(codegenCommand, {
      cwd,
      stdio: verbose ? 'inherit' : 'pipe',
    });
  } catch (error) {
    console.error('Error: Failed to run GraphQL code generation');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  // Get git status after running codegen
  const gitStatusAfter = getGitStatus(cwd);

  ensureCondition(
    gitStatusAfter !== null,
    'Error: Failed to get git status'
  );

  // Compare git status before and after
  // Type assertion safe here because ensureCondition ensures non-null
  if (gitStatusBefore !== gitStatusAfter) {
    console.error('');
    console.error('⚠️  WARNING: GraphQL fakes need regeneration!');
    console.error('   Modified files:');

    // Show what changed by comparing git status outputs
    try {
      // Parse the status outputs to show what changed
      const beforeLines = new Set(
        gitStatusBefore!.split('\n').filter((line) => line.length > 0)
      );
      const afterLines = gitStatusAfter!.split('\n').filter((line) => line.length > 0);

      // Find files that are new or have different status
      const changedFiles = afterLines.filter((line) => !beforeLines.has(line));

      if (changedFiles.length > 0) {
        changedFiles.forEach((line) => {
          // Extract just the filename from the porcelain format (e.g., "?? file.dart" or "M  file.dart")
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
    console.error(`   Run '${codegenCommand}' and commit changes`);
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ GraphQL fakes are up to date');
  }
  process.exit(0);
}
