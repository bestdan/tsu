import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import type { ChangedFilesOptions } from '../../types/command-options.js';
import { setVerbose } from '../../utils/verbose-state.js';

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
}

/**
 * Runs multiple hook checks and tracks if any fail.
 * Exits with code 1 if any check fails, 0 if all pass.
 *
 * Steps:
 * 1. Determines which hooks to run based on flags (default: all)
 * 2. Runs each selected hook check by spawning subprocess
 * 3. Tracks failures and continues running remaining checks
 * 4. Exits with appropriate code (1 if any failed, 0 if all passed)
 */
export function hookCollate(options: HookCollateOptions = {}): void {
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

  if (dartFiles.length === 0 && graphqlFiles.length === 0) {
    logIfVerbose(verbose, '✓ No Dart or GraphQL files modified');
    process.exit(0);
  }

  // Determine which hooks to run (default: all)
  const runAll =
    !options.dartFormat && !options.dartAnalysis && !options.dcmAnalyze && !options.graphql;
  const runDartFormat = runAll || options.dartFormat;
  const runDartAnalysis = runAll || options.dartAnalysis;
  const runDcmAnalyze = runAll || options.dcmAnalyze;
  const runGraphql = runAll || options.graphql;

  const failures: string[] = [];

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

  // Helper to run a hook command and track failures
  const runHook = (name: string, command: string, skipCondition?: boolean): void => {
    if (skipCondition) {
      logIfVerbose(verbose, `⏭️  Skipping ${name} (no relevant files)`);
      return;
    }

    /* v8 ignore next -- @preserve */
    try {
      logIfVerbose(verbose, `\n▶️  Running ${name}...`);
      const args = buildArgs();
      const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;

      execSync(fullCommand, {
        cwd,
        stdio: verbose ? 'inherit' : 'pipe',
      });
      logIfVerbose(verbose, `✓ ${name} passed`);
    } catch {
      failures.push(name);
      logIfVerbose(verbose, `✗ ${name} failed`);
    }
  };

  // Find the tsu binary path (either from node_modules or global)
  const getTsuCommand = (): string => {
    // Try to use the built version from this package first
    try {
      execSync('which tsu', { stdio: 'pipe' });
      return 'tsu';
    } catch {
      // Fallback to node execution of the built CLI using absolute path
      // __dirname is the dist/commands/hook directory, so we need to go up to dist
      const cliPath = join(__dirname, '..', '..', 'cli.js');
      return `node ${cliPath}`;
    }
  };

  const tsu = getTsuCommand();

  // Run dart format check
  if (runDartFormat) {
    runHook('dart format check', `${tsu} hook format check`, dartFiles.length === 0);
  }

  // Run dart analysis check
  if (runDartAnalysis) {
    runHook('dart analysis check', `${tsu} hook analysis check`, dartFiles.length === 0);
  }

  // Run DCM analyze check
  if (runDcmAnalyze) {
    runHook('DCM analyze check', `${tsu} hook dcm analyze check`, dartFiles.length === 0);
  }

  // Run GraphQL check
  if (runGraphql) {
    runHook('GraphQL check', `${tsu} hook graphql check`, graphqlFiles.length === 0);
  }

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
