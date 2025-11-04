#!/usr/bin/env node
import { Command } from 'commander';
import { gitCheck } from './commands/git/check.js';
import { gitRoot } from './commands/git/root.js';
import { gitChanged } from './commands/git/changed.js';
import { gitBranch } from './commands/git/branch.js';
import { gitIsMain } from './commands/git/is-main.js';
import { gitCommitMsg } from './commands/git/commit-msg.js';
import { gitPRDescription } from './commands/git/pr-description.js';
import { filesFilter } from './commands/files/filter/suffix.js';
import { dartCheck } from './commands/dart/check.js';
import { dartRoot } from './commands/dart/root.js';
import { dartPackage } from './commands/dart/package.js';
import { dartChanged } from './commands/dart/changed/index.js';
import { dartChangedDownstream } from './commands/dart/changed/downstream.js';
import { dartHookFormatCheck } from './commands/dart/hook/format/check.js';
import { dartHookAnalysisCheck } from './commands/dart/hook/analysis/check.js';
import { dartHookFixCheck } from './commands/dart/hook/fix/check.js';
import { dartHookDcmCheck } from './commands/dart/hook/dcm/fix/check.js';
import { dartHookDcmAnalyzeCheck } from './commands/dart/hook/dcm/analyze/check.js';
import { dartHookGraphqlCheck } from './commands/dart/hook/graphql/check.js';
import { dartFix } from './commands/dart/fix.js';
import { checkExternals } from './commands/check/externals.js';

const program = new Command();

program
  .name('tsutils')
  .description('TypeScript command line utilities')
  .version('0.1.0');

// Check subcommand namespace
const check = program
  .command('check')
  .description('Check system dependencies and environment');

check
  .command('externals')
  .description('Check if external dependencies (dart, dcm, melos, claude) are installed')
  .option('-v, --verbose', 'show human-readable status messages (output to stderr)')
  .action((options: { verbose?: boolean }) => {
    checkExternals(options);
  });

// Git subcommand namespace
const git = program.command('git').description('Git repository utilities');

git
  .command('check')
  .description(
    'Check if current directory is in a git repository (exit code only)'
  )
  .argument('[path]', 'path to check (defaults to current directory)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((path: string | undefined, options: { verbose?: boolean }) => {
    gitCheck(path, options);
  });

git
  .command('root')
  .description('Get the root directory of the git repository')
  .argument('[path]', 'path to check (defaults to current directory)')
  .option('-v, --verbose', 'show human-readable label (output to stderr)')
  .action((path: string | undefined, options: { verbose?: boolean }) => {
    gitRoot(path, options);
  });

git
  .command('changed')
  .description('Show files that have changed compared to main branch')
  .option('-s, --staged', 'show staged changes only')
  .option('-u, --unstaged', 'show unstaged changes only')
  .option('-a, --all', 'show all changes (committed, staged, and unstaged)')
  .option('-p, --push', 'show files in commits that would be pushed to upstream')
  .option(
    '-b, --base-branch <branch>',
    'base branch to compare against',
    'main'
  )
  .option('-v, --verbose', 'show headers and counts (output to stderr)')
  .action(
    (options: {
      staged?: boolean;
      unstaged?: boolean;
      all?: boolean;
      push?: boolean;
      baseBranch?: string;
      verbose?: boolean;
    }) => {
      gitChanged(options);
    }
  );

git
  .command('branch')
  .description('Get the current git branch name')
  .argument('[path]', 'path to check (defaults to current directory)')
  .option('-v, --verbose', 'show human-readable label (output to stderr)')
  .action((path: string | undefined, options: { verbose?: boolean }) => {
    gitBranch(path, options);
  });

git
  .command('is-main')
  .description('Check if current branch is main (exit code only)')
  .argument('[path]', 'path to check (defaults to current directory)')
  .option('-b, --branch <name>', 'main branch name to check against', 'main')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action(
    (
      path: string | undefined,
      options: { verbose?: boolean; branch?: string }
    ) => {
      gitIsMain(path, options);
    }
  );

git
  .command('commit-msg')
  .description('Generate a commit message from staged changes using Claude')
  .option(
    '-c, --commit',
    'automatically create the commit with generated message'
  )
  .option('-v, --verbose', 'show progress messages (output to stderr)')
  .action((options: { commit?: boolean; verbose?: boolean }) => {
    gitCommitMsg(options);
  });

git
  .command('pr-description')
  .description(
    'Generate a GitHub PR description from branch changes using Claude'
  )
  .option(
    '-b, --base-branch <branch>',
    'base branch to compare against',
    'main'
  )
  .option('-v, --verbose', 'show progress messages (output to stderr)')
  .action((options: { baseBranch?: string; verbose?: boolean }) => {
    gitPRDescription(options);
  });

// Files subcommand namespace
const files = program
  .command('files')
  .description('File manipulation utilities');

const filesFilterCmd = files
  .command('filter')
  .description('Filter files from stdin');

filesFilterCmd
  .command('suffix')
  .description('Filter files by removing those matching suffix patterns')
  .argument(
    '<suffixes...>',
    'suffix patterns to filter out (e.g., .g.dart .gql.dart)'
  )
  .option('-v, --verbose', 'show filter statistics (output to stderr)')
  .action((suffixes: string[], options: { verbose?: boolean }) => {
    filesFilter(suffixes, options);
  });

// Dart subcommand namespace
const dart = program.command('dart').description('Dart package utilities');

dart
  .command('check')
  .description(
    'Check if current directory is in a Dart package (exit code only)'
  )
  .argument('[path]', 'path to check (defaults to current directory)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((path: string | undefined, options: { verbose?: boolean }) => {
    dartCheck(path, options);
  });

dart
  .command('root')
  .description('Get the root directory of the Dart package')
  .argument('[path]', 'path to check (defaults to current directory)')
  .option('-v, --verbose', 'show human-readable label (output to stderr)')
  .action((path: string | undefined, options: { verbose?: boolean }) => {
    dartRoot(path, options);
  });

dart
  .command('package')
  .description(
    'Get the package root containing a specific file (useful in mono-repos)'
  )
  .argument('<file>', 'path to the file')
  .option('-v, --verbose', 'show human-readable label (output to stderr)')
  .action((file: string, options: { verbose?: boolean }) => {
    dartPackage(file, options);
  });

// Dart changed subcommand
const dartChangedCmd = dart
  .command('changed')
  .description('Show Dart files that have changed');

dartChangedCmd
  .description('Show Dart files that have changed compared to main branch')
  .option('-s, --staged', 'show staged changes only')
  .option('-u, --unstaged', 'show unstaged changes only')
  .option('-a, --all', 'show all changes (committed, staged, and unstaged)')
  .option(
    '-b, --base-branch <branch>',
    'base branch to compare against',
    'main'
  )
  .option('-v, --verbose', 'show headers and counts (output to stderr)')
  .action(
    (options: {
      staged?: boolean;
      unstaged?: boolean;
      all?: boolean;
      baseBranch?: string;
      verbose?: boolean;
    }) => {
      dartChanged(options);
    }
  );

dartChangedCmd
  .command('downstream')
  .description('Find all Dart files that depend on changed Dart files')
  .option('-s, --staged', 'analyze staged changes only')
  .option('-u, --unstaged', 'analyze unstaged changes only')
  .option('-a, --all', 'analyze all changes (committed, staged, and unstaged)')
  .option(
    '-b, --base-branch <branch>',
    'base branch to compare against',
    'main'
  )
  .option('--relative', 'output relative paths instead of absolute paths')
  .option(
    '-v, --verbose',
    'show detailed progress information (output to stderr)'
  )
  .action(
    (options: {
      staged?: boolean;
      unstaged?: boolean;
      all?: boolean;
      baseBranch?: string;
      relative?: boolean;
      verbose?: boolean;
    }) => {
      dartChangedDownstream(options);
    }
  );

dart
  .command('fix')
  .description('Run dart fix (dry-run by default)')
  .option('-v, --verbose', 'show detailed progress information')
  .option('-f, --files <files...>', 'specific files or directories to check')
  .option('--apply', 'apply fixes automatically (default is dry-run)')
  .option('--packages', 'run on affected packages instead of individual files')
  .action(
    (options: {
      verbose?: boolean;
      files?: string[];
      apply?: boolean;
      packages?: boolean;
    }) => {
      dartFix(options);
    }
  );

// Dart hook subcommand namespace
const dartHook = dart
  .command('hook')
  .description('Git hook utilities for Dart');

dartHook
  .command('format')
  .command('check')
  .description(
    'Check if Dart files are properly formatted (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((files: string[], options: { verbose?: boolean }) => {
    dartHookFormatCheck({ ...options, files });
  });

dartHook
  .command('analysis')
  .command('check')
  .description(
    'Check if Dart files pass dart analyze (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((files: string[], options: { verbose?: boolean }) => {
    dartHookAnalysisCheck({ ...options, files });
  });

dartHook
  .command('fix')
  .command('check')
  .description(
    'Check if Dart files pass dart fix and apply fixes (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((files: string[], options: { verbose?: boolean }) => {
    dartHookFixCheck({ ...options, files });
  });

// Dart hook DCM subcommand namespace
const dartHookDcm = dartHook
  .command('dcm')
  .description('DCM utilities for Dart code quality');

dartHookDcm
  .command('fix')
  .command('check')
  .description(
    'Check if Dart files pass DCM fix checks (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((files: string[], options: { verbose?: boolean }) => {
    dartHookDcmCheck({ ...options, files });
  });

dartHookDcm
  .command('analyze')
  .command('check')
  .description(
    'Check if Dart files pass DCM analyze checks (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action((files: string[], options: { verbose?: boolean }) => {
    dartHookDcmAnalyzeCheck({ ...options, files });
  });

dartHook
  .command('graphql')
  .command('check')
  .description(
    'Check if GraphQL fakes are up to date (suitable for pre-push hooks)'
  )
  .argument('[files...]', 'specific files to check (defaults to all changed files)')
  .option(
    '-v, --verbose',
    'show human-readable status messages (output to stderr)'
  )
  .action(async (files: string[], options: { verbose?: boolean; }) => {
    await dartHookGraphqlCheck({ ...options, files });
  });

program.parse();
