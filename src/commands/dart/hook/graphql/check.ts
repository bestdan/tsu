import { execSync } from 'node:child_process';
import * as readline from 'node:readline';
import {
  isGitRepo,
  getAllChangedFiles,
  getGitStatus,
  getFilesInRange,
} from '../../../git/utils/git.js';
import { isDartPackage } from '../../utils/dart.js';
import { ensureCondition } from '../../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../../utils/shell.js';
import { logIfVerbose } from '../../../../utils/logger.js';

export interface DartHookGraphqlCheckOptions {
  verbose?: boolean;
  files?: string[];
  /** Read refs from stdin (for pre-push hook mode) */
  hookMode?: boolean;
}

/**
 * Reads refs from stdin (pre-push hook format) and returns files that changed.
 * Pre-push hook stdin format: <local ref> <local sha> <remote ref> <remote sha>
 */
async function getFilesFromStdin(cwd: string, verbose: boolean): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });

    const allFiles = new Set<string>();

    rl.on('line', (line: string) => {
      const parts = line.trim().split(/\s+/);
      if (parts.length !== 4) {
        return; // Invalid format, skip
      }

      const [, localSha, , remoteSha] = parts;

      // Skip if deleting a branch
      if (localSha === '0000000000000000000000000000000000000000') {
        return;
      }

      // Calculate the range based on whether the remote ref exists
      let range: string;
      if (remoteSha === '0000000000000000000000000000000000000000') {
        // Remote ref doesn't exist yet (new branch), compare against empty tree
        const emptyTree = execSync('git hash-object -t tree /dev/null', {
          cwd,
          encoding: 'utf-8',
        }).trim();
        range = `${emptyTree}..${localSha}`;
      } else {
        // Remote ref exists, compare what we're about to push
        range = `${remoteSha}..${localSha}`;
      }

      logIfVerbose(verbose, `Checking range: ${range}`);

      // Get files in this range
      const filesInRange = getFilesInRange({ range, cwd });
      if (filesInRange) {
        filesInRange.forEach((file) => allFiles.add(file));
      }
    });

    rl.on('close', () => {
      resolve(Array.from(allFiles));
    });

    rl.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Checks if GraphQL files are modified and runs code generation to verify fakes are up to date.
 * Supports three modes:
 * 1. Explicit file list (--files)
 * 2. Hook mode (--hook) - reads refs from stdin for pre-push hooks
 * 3. Default mode - checks all changed files
 *
 * Steps:
 * 1. Checks if melos is installed
 * 2. Gets modified .graphql files
 * 3. Saves git status before running codegen
 * 4. Runs GraphQL code generation (melos run codegen:graphql and melos run codegen:graphql:test)
 * 5. Checks if codegen created any changes
 * 6. Exits with error if files were modified by codegen
 */
export async function dartHookGraphqlCheck(
  options: DartHookGraphqlCheckOptions = {}
): Promise<void> {
  const verbose = options.verbose || false;
  const codegenCommands = [
    'melos run codegen:graphql',
    'melos run codegen:graphql:test',
  ];

  logIfVerbose(verbose, '🧪 Checking for modified GraphQL files...');

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  let allFiles: string[];

  // Determine which files to check
  if (options.files && options.files.length > 0) {
    // Mode 1: Explicit file list provided
    logIfVerbose(verbose, 'Using provided files');
    allFiles = options.files;
  } else if (options.hookMode) {
    // Mode 2: Hook mode - read refs from stdin
    logIfVerbose(verbose, 'Reading refs from stdin (hook mode)');
    allFiles = await getFilesFromStdin(cwd, verbose);
  } else {
    // Mode 3: Default - check all changed files
    logIfVerbose(verbose, 'Checking all changed files');
    allFiles = getAllChangedFiles(cwd);
  }

  // Filter to only GraphQL files
  const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));

  ensureCondition(
    graphqlFiles.length > 0,
    verbose ? '✓ No GraphQL files modified (skipping)' : '',
    { exitCode: 0 }
  );

  /* v8 ignore next -- @preserve */
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
  ensureCondition(
    gitStatusAfter !== null,
    'Error: Failed to get git status'
  );

  // Compare git status before and after
  // TypeScript knows these are non-null after ensureCondition checks
  // Using type guards instead of assertions for better safety
  /* v8 ignore next -- @preserve */
  if (gitStatusBefore && gitStatusAfter && gitStatusBefore !== gitStatusAfter) {
    console.error('');
    console.error('⚠️  WARNING: GraphQL fakes need regeneration!');
    console.error('   Modified files:');

    // Show what changed by comparing git status outputs
    /* v8 ignore next -- @preserve */
    try {
      // Parse the status outputs to show what changed
      const beforeLines = new Set(
        gitStatusBefore.split('\n').filter((line) => line.length > 0)
      );
      const afterLines = gitStatusAfter.split('\n').filter((line) => line.length > 0);

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
    console.error(
      `   Run 'melos run codegen:graphql && melos run codegen:graphql:test' and commit changes`
    );
    process.exit(1);
  }

  logIfVerbose(verbose, '✓ GraphQL fakes are up to date');
  process.exit(0);
}
