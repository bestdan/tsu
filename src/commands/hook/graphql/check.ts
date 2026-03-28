import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus, getAllChangedFiles } from '../../git/utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES } from '../../dart/utils/dart.js';
import { ensureCondition, displayFileList } from '../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
import type { ChangedFilesOptions } from '../../../types/command-options.js';
import { setVerbose } from '../../../utils/verbose-state.js';

export type DartHookGraphqlCheckOptions = ChangedFilesOptions;

const GRAPHQL_GENERATED_SUFFIXES = new Set(
  COMMON_DART_CODEGEN_SUFFIXES.filter(
    (suffix) => suffix === '.gql.dart' || suffix === '.fakes.dart'
  )
);

/**
 * Checks if GraphQL files are modified and runs code generation to verify fakes are up to date.
 * Gets changed files based on options (staged, unstaged, all, or committed changes).
 *
 * Steps:
 * 1. Checks if melos is installed
 * 2. Gets modified .graphql files, exits if none
 * 3. Saves git status before running codegen
 * 4. Runs GraphQL code generation (melos run codegen:graphql and melos run codegen:graphql:test)
 * 5. Checks if codegen created any changes
 * 6. Exits with error if files were modified by codegen
 */
export async function dartHookGraphqlCheck(
  options: DartHookGraphqlCheckOptions = {}
): Promise<void> {
  const verbose = options.verbose || false;
  const codegenCommands = ['melos run codegen:graphql', 'melos run codegen:graphql:test'];

  // Set global verbose state for downstream functions
  setVerbose(verbose);

  logIfVerbose(verbose, '🧪 Checking for modified GraphQL files...');

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get files to check based on options
  const allFiles = getAllChangedFiles(options, cwd);

  // Filter to only GraphQL files
  const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));

  ensureCondition(
    graphqlFiles.length > 0,
    verbose ? '✓ No GraphQL files modified (skipping)' : '',
    { exitCode: 0 }
  );

  // Display files being checked in verbose mode
  displayFileList({
    files: graphqlFiles,
    verbose,
    message: 'Running GraphQL codegen on',
  });

  // Check if melos is installed
  ensureCondition(
    isCommandInstalled('melos'),
    verbose ? '⚠️  Warning: Melos not installed, skipping' : '',
    { exitCode: 0 }
  );

  // Get git status before running codegen
  const gitStatusBefore = getGitStatus(cwd);

  ensureCondition(gitStatusBefore !== null, 'Error: Failed to get git status');

  logIfVerbose(verbose, '🔧 Running GraphQL code generation...');

  /* v8 ignore next -- @preserve */
  // Run the code generation commands
  try {
    for (const command of codegenCommands) {
      execSync(command, {
        cwd,
        stdio: verbose ? 'inherit' : 'pipe',
      });
    }
  } catch (error) {
    console.error('Error: Failed to run GraphQL code generation');
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }

  // Get git status after running codegen
  /* v8 ignore next -- @preserve */
  const gitStatusAfter = getGitStatus(cwd);

  /* v8 ignore next -- @preserve */
  ensureCondition(gitStatusAfter !== null, 'Error: Failed to get git status');

  // Compare git status before and after
  // ensureCondition calls process.exit but doesn't narrow types, so add explicit guards
  /* v8 ignore next -- @preserve */
  if (gitStatusBefore === null || gitStatusAfter === null) return;
  /* v8 ignore next -- @preserve */
  const changedFiles = getNewlyChangedFiles(gitStatusBefore, gitStatusAfter).filter(
    isGraphqlOwnedFile
  );

  if (changedFiles.length > 0) {
    console.error('');
    console.error('⚠️  WARNING: GraphQL fakes need regeneration!');
    console.error('   Modified files:');

    changedFiles.forEach((file) => {
      console.error(`   ${file}`);
    });

    console.error('');
    console.error(
      `   Run 'melos run codegen:graphql && melos run codegen:graphql:test' and commit changes`
    );
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ GraphQL fakes are up to date');
  process.exit(0);
}

function parseGitStatusEntries(status: string): Map<string, string> {
  const entries = new Map<string, string>();

  status
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const match = line.match(/^(.{2})\s+(.+)$/);
      if (!match) {
        return;
      }

      const [, state, rawPath] = match;
      if (!state || !rawPath) return;
      const normalizedPath = rawPath.includes(' -> ')
        ? (rawPath.split(' -> ').pop() ?? rawPath)
        : rawPath;
      if (normalizedPath) {
        entries.set(normalizedPath, state);
      }
    });

  return entries;
}

function getNewlyChangedFiles(before: string, after: string): string[] {
  const beforeEntries = parseGitStatusEntries(before);
  const afterEntries = parseGitStatusEntries(after);

  return Array.from(afterEntries.entries())
    .filter(([path, state]) => beforeEntries.get(path) !== state)
    .map(([path]) => path);
}

function isGraphqlOwnedFile(file: string): boolean {
  return Array.from(GRAPHQL_GENERATED_SUFFIXES).some((suffix) => file.endsWith(suffix));
}
