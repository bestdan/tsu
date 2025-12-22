import { execSync, execFile, ExecException } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import type { ChangedFilesOptions } from '../../types/command-options.js';
import { setVerbose } from '../../utils/verbose-state.js';

const execFileAsync = promisify(execFile);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface HookCollateOptions extends ChangedFilesOptions {
  /** Run dart format check */
  dartFormat?: boolean;
  /** Run dart analysis check */
  dartAnalysis?: boolean;
  /** Run DCM analyze check */
  dcmAnalyze?: boolean;
  /** Run GraphQL check */
  graphql?: boolean;
  /** Run git codeowners check */
  codeowners?: boolean;
}

/**
 * Runs multiple hook checks concurrently and tracks if any fail.
 * Exits with code 1 if any check fails, 0 if all pass.
 *
 * Steps:
 * 1. Determines which hooks to run based on flags (default: all)
 * 2. Runs each selected hook check concurrently using Promise.allSettled
 * 3. Tracks failures and continues running remaining checks
 * 4. Exits with appropriate code (1 if any failed, 0 if all passed)
 */
export async function hookCollate(options: HookCollateOptions = {}): Promise<void> {
  const verbose = options.verbose || false;

  // Set global verbose state for downstream functions
  setVerbose(verbose);

  logIfVerbose(verbose, '📋 Running pre-push checks...');

  // Check we're in both a git repo and a Dart package
  ensureCondition(isGitRepo(), 'Error: Not in a git repository');
  ensureCondition(isDartPackage(), 'Error: Not in a Dart package');

  const cwd = process.cwd();

  // Get files to check based on options (we check once to optimize)
  const allFiles = getAllChangedFiles(options, cwd);

  // Check if there are any files to process
  const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));
  const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));

  // Determine which hooks to run (default: all)
  const runAll =
    !options.dartFormat &&
    !options.dartAnalysis &&
    !options.dcmAnalyze &&
    !options.graphql &&
    !options.codeowners;
  const runDartFormat = runAll || options.dartFormat;
  const runDartAnalysis = runAll || options.dartAnalysis;
  const runDcmAnalyze = runAll || options.dcmAnalyze;
  const runGraphql = runAll || options.graphql;
  const runCodeowners = runAll || options.codeowners;

  // Exit early if no relevant files and codeowners check is not enabled
  if (dartFiles.length === 0 && graphqlFiles.length === 0 && !runCodeowners) {
    logIfVerbose(verbose, '✓ No Dart or GraphQL files modified');
    process.exit(0);
  }

  // Build base command arguments for changed file options
  const buildArgs = (): string[] => {
    const args: string[] = [];
    if (options.staged) args.push('--staged');
    if (options.unstaged) args.push('--unstaged');
    if (options.all) args.push('--all');
    if (options.baseBranch) args.push('--base-branch', options.baseBranch);
    if (verbose) args.push('--verbose');
    return args;
  };

  // Helper to run a hook command asynchronously
  const runHook = async (
    name: string,
    file: string,
    args: string[],
    skipCondition: boolean = false,
    appendChangedFileArgs: boolean = true
  ): Promise<{ name: string; passed: boolean }> => {
    if (skipCondition) {
      logIfVerbose(verbose, `⏭️  Skipping ${name} (no relevant files)`);
      return { name, passed: true };
    }

    /* v8 ignore next -- @preserve */
    try {
      logIfVerbose(verbose, `\n▶️  Running ${name}...`);
      const cmdArgs = appendChangedFileArgs ? [...args, ...buildArgs()] : [...args];

      const result = await execFileAsync(file, cmdArgs, { cwd });

      // In verbose mode, output the command results
      if (verbose && result.stdout) {
        process.stderr.write(result.stdout);
      }
      if (verbose && result.stderr) {
        process.stderr.write(result.stderr);
      }

      logIfVerbose(verbose, `✓ ${name} passed`);
      return { name, passed: true };
    } catch (error) {
      // In verbose mode, show error output
      if (verbose && error && typeof error === 'object') {
        const execError = error as ExecException & { stdout?: string; stderr?: string };
        if (execError.stdout) {
          process.stderr.write(execError.stdout);
        }
        if (execError.stderr) {
          process.stderr.write(execError.stderr);
        }
      }
      logIfVerbose(verbose, `✗ ${name} failed`);
      return { name, passed: false };
    }
  };

  // Find the tsu binary path (either from node_modules or global)
  const getTsuCommand = (): { file: string; args: string[] } => {
    // Try to use the built version from this package first
    try {
      execSync('which tsu', { stdio: 'pipe' });
      return { file: 'tsu', args: [] };
    } catch {
      // Fallback to node execution of the built CLI using absolute path
      // __dirname is the dist/commands/hook directory, so we need to go up to dist
      const cliPath = join(__dirname, '..', '..', 'cli.js');
      return { file: 'node', args: [cliPath] };
    }
  };

  const tsuCmd = getTsuCommand();

  // Collect all hooks to run
  const hooks: Promise<{ name: string; passed: boolean }>[] = [];

  if (runDartFormat) {
    hooks.push(
      runHook(
        'dart format check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'format', 'check'],
        dartFiles.length === 0
      )
    );
  }

  if (runDartAnalysis) {
    hooks.push(
      runHook(
        'dart analysis check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'analysis', 'check'],
        dartFiles.length === 0
      )
    );
  }

  if (runDcmAnalyze) {
    hooks.push(
      runHook(
        'DCM analyze check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'dcm', 'analyze', 'check'],
        dartFiles.length === 0
      )
    );
  }

  if (runGraphql) {
    hooks.push(
      runHook(
        'GraphQL check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'graphql', 'check'],
        graphqlFiles.length === 0
      )
    );
  }

  if (runCodeowners) {
    const codeownersArgs = [...tsuCmd.args, 'git', 'codeowners', 'check'];
    if (verbose) {
      codeownersArgs.push('--verbose');
    }
    hooks.push(
      runHook(
        'git codeowners check',
        tsuCmd.file,
        codeownersArgs,
        false, // skipCondition: always run codeowners check if enabled
        false // appendChangedFileArgs: codeowners check only accepts --verbose
      )
    );
  }

  // Run all hooks concurrently
  const results = await Promise.allSettled(hooks);

  // Extract failures from results
  const failures: string[] = [];
  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && !result.value.passed) {
      // Hook completed but failed
      failures.push(result.value.name);
    } else if (result.status === 'rejected') {
      // Hook promise was rejected (unexpected error - should be very rare)
      const errorMsg =
        result.reason instanceof Error ? result.reason.message : String(result.reason);
      failures.push(`Hook execution error: ${errorMsg}`);
      logIfVerbose(verbose, `✗ Unexpected error in hook ${index + 1}: ${errorMsg}`);
    }
  });

  // Report results
  if (failures.length > 0) {
    console.error('');
    console.error('❌ One or more checks failed:');
    failures.forEach((check) => {
      console.error(`  - ${check}`);
    });
    console.error('');
    console.error('Push aborted.');
    process.exit(1);
  }

  logIfVerbose(verbose, '\n✅ All checks passed. Push allowed.');
  process.exit(0);
}
