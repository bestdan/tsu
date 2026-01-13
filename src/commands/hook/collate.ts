import { execSync, execFile, ExecException } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Listr, type ListrTask } from 'listr2';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import type { ChangedFilesOptions } from '../../types/command-options.js';
import { setVerbose } from '../../utils/verbose-state.js';
import { loadConfig, getTimeoutFromConfig } from '../../utils/config.js';

const execFileAsync = promisify(execFile);

/**
 * Details about a failed check, including specific files and error message.
 */
interface FailureDetail {
  name: string;
  files?: string[];
  message?: string;
}

/**
 * Parses failure output from sub-commands to extract file lists and error messages.
 * Recognizes output patterns from format, analysis, dcm, graphql, and codeowners checks.
 */
function parseFailureOutput(output: string): { files: string[]; message?: string } {
  const lines = output.split('\n').map((line) => line.trim());
  const files: string[] = [];
  let message: string | undefined;

  // Pattern matchers for different check types
  const patterns = [
    {
      marker: 'Please stage and commit these changes:',
      message: 'Files need formatting',
    },
    {
      marker: 'dart analyze found issues in the following file(s):',
      message: 'dart analyze found issues',
    },
    {
      marker: 'DCM analyze found issues in the following file(s):',
      message: 'DCM analyze found issues',
    },
    {
      marker: 'Modified files:',
      message: 'Files were modified by codegen',
    },
    {
      marker: 'CODEOWNERS files are out of sync!',
      message: 'CODEOWNERS files are out of sync',
    },
    {
      marker: 'There are unowned files in the repository!',
      message: 'Unowned files detected',
    },
  ];

  for (const pattern of patterns) {
    const markerIndex = lines.findIndex((line) => line.includes(pattern.marker));
    if (markerIndex !== -1) {
      message = pattern.message;

      // Extract file paths from lines after the marker
      for (let i = markerIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        // Stop at empty lines or lines that look like instructions
        if (!line || line.startsWith('Run ') || line.startsWith('Please ')) {
          break;
        }
        // Clean up file paths (remove leading whitespace, bullets, etc.)
        const cleanedFile = line.replace(/^[\s-]*/, '').trim();
        if (cleanedFile && !cleanedFile.startsWith('(') && cleanedFile.includes('.')) {
          files.push(cleanedFile);
        }
      }
      break;
    }
  }

  return { files, message };
}

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
  /** Load configuration from config file */
  withConfig?: boolean;
}

/**
 * Runs multiple hook checks concurrently and tracks if any fail.
 * Exits with code 1 if any check fails, 0 if all pass.
 *
 * Uses listr2 to display tasks in a grouped, organized format with inline updates.
 * In verbose mode, uses the verbose renderer to show all command output.
 *
 * Steps:
 * 1. Determines which hooks to run based on flags (default: all)
 * 2. Runs each selected hook check concurrently using listr2
 * 3. Tasks are grouped by command with clear status indicators
 * 4. Tracks failures and continues running remaining checks
 * 5. Exits with appropriate code (1 if any failed, 0 if all passed)
 */
export async function hookCollate(options: HookCollateOptions = {}): Promise<void> {
  const verbose = options.verbose || false;

  // Set global verbose state for downstream functions
  setVerbose(verbose);

  logIfVerbose(verbose, '📋 Running pre-push checks...');

  // Load config if --with-config flag is set
  const config = options.withConfig ? loadConfig() : null;
  if (config && verbose) {
    logIfVerbose(verbose, '⚙️  Loaded configuration from file');
  }

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

  // Helper to create a listr2 task for a hook command
  const createHookTask = (
    name: string,
    file: string,
    args: string[],
    skipCondition: boolean = false,
    appendChangedFileArgs: boolean = true,
    timeoutMs?: number
  ) => {
    return {
      title: name,
      skip: () => {
        if (skipCondition) {
          return `Skipping ${name} (no relevant files)`;
        }
        return false;
      },
      task: async (ctx: { failures?: FailureDetail[] }, task: { output?: string }) => {
        /* v8 ignore next -- @preserve */
        try {
          const cmdArgs = appendChangedFileArgs ? [...args, ...buildArgs()] : [...args];

          const execOptions: { cwd: string; timeout?: number } = { cwd };
          if (timeoutMs) {
            execOptions.timeout = timeoutMs;
          }

          const result = await execFileAsync(file, cmdArgs, execOptions);

          // In verbose mode, output the command results using task.output
          if (verbose) {
            const output: string[] = [];
            if (result.stdout) {
              output.push(result.stdout.trim());
            }
            if (result.stderr) {
              output.push(result.stderr.trim());
            }
            if (output.length > 0) {
              task.output = output.join('\n');
            }
          }

          return `✓ ${name} passed`;
        } catch (error) {
          const execError = error as ExecException & { stdout?: string; stderr?: string };
          const combinedOutput = [execError.stdout || '', execError.stderr || ''].join('\n');

          // In verbose mode, show error output
          if (verbose) {
            const output: string[] = [];
            if (execError.stdout) {
              output.push(execError.stdout.trim());
            }
            if (execError.stderr) {
              output.push(execError.stderr.trim());
            }
            if (output.length > 0) {
              task.output = output.join('\n');
            }
          }

          // Parse the output to extract file details
          const parsed = parseFailureOutput(combinedOutput);
          const failureDetail: FailureDetail = { name };
          if (parsed.files.length > 0) {
            failureDetail.files = parsed.files;
          }
          if (parsed.message) {
            failureDetail.message = parsed.message;
          }

          ctx.failures = ctx.failures || [];
          ctx.failures.push(failureDetail);
          throw new Error(`${name} failed`);
        }
      },
    };
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

  // Define context type for listr2 tasks
  type HookContext = { failures?: FailureDetail[] };

  // Collect all hook tasks to run
  const hookTasks: ListrTask<HookContext>[] = [];

  if (runDartFormat) {
    const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-format');
    hookTasks.push(
      createHookTask(
        'dart format check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'format', 'check'],
        dartFiles.length === 0,
        true,
        timeout
      )
    );
  }

  if (runDartAnalysis) {
    const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-analysis');
    hookTasks.push(
      createHookTask(
        'dart analysis check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'analysis', 'check'],
        dartFiles.length === 0,
        true,
        timeout
      )
    );
  }

  if (runDcmAnalyze) {
    const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dcm-analyze');
    hookTasks.push(
      createHookTask(
        'DCM analyze check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'dcm', 'analyze', 'check'],
        dartFiles.length === 0,
        true,
        timeout
      )
    );
  }

  if (runGraphql) {
    const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'graphql');
    hookTasks.push(
      createHookTask(
        'GraphQL check',
        tsuCmd.file,
        [...tsuCmd.args, 'hook', 'graphql', 'check'],
        graphqlFiles.length === 0,
        true,
        timeout
      )
    );
  }

  if (runCodeowners) {
    const codeownersArgs = [...tsuCmd.args, 'git', 'codeowners', 'check'];
    if (verbose) {
      codeownersArgs.push('--verbose');
    }
    const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'codeowners');
    hookTasks.push(
      createHookTask(
        'git codeowners check',
        tsuCmd.file,
        codeownersArgs,
        false, // skipCondition: always run codeowners check if enabled
        false, // appendChangedFileArgs: codeowners check only accepts --verbose
        timeout
      )
    );
  }

  // Run all hooks using listr2
  const tasks = new Listr(hookTasks, {
    concurrent: true,
    exitOnError: false,
    // Use verbose renderer in verbose mode to see all output
    renderer: verbose ? 'verbose' : 'default',
    rendererOptions: {
      removeEmptyLines: true,
    },
    ctx: { failures: [] },
  });

  /* v8 ignore next -- @preserve */
  try {
    const ctx = await tasks.run();

    // Check for failures
    if (ctx.failures && ctx.failures.length > 0) {
      console.error('');
      console.error('❌ One or more checks failed:');
      ctx.failures.forEach((failure: FailureDetail) => {
        console.error(`  - ${failure.name}`);
        if (failure.message) {
          console.error(`    ${failure.message}`);
        }
        if (failure.files && failure.files.length > 0) {
          failure.files.forEach((file) => {
            console.error(`      ${file}`);
          });
        }
      });
      console.error('');
      console.error('Push aborted.');
      process.exit(1);
    }

    logIfVerbose(verbose, '\n✅ All checks passed. Push allowed.');
    process.exit(0);
  } catch {
    // Listr2 throws an error when tasks fail
    // The error details are already shown in the task output
    console.error('');
    console.error('Push aborted.');
    process.exit(1);
  }
}
