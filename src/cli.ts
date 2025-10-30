#!/usr/bin/env node
import { Command } from 'commander';
import { greet } from './commands/greet.js';
import { gitCheck } from './commands/git-check.js';
import { gitRoot } from './commands/git-root.js';
import { gitChanged } from './commands/git-changed.js';
import { filesFilter } from './commands/files-filter.js';

const program = new Command();

program
  .name('tsutils')
  .description('TypeScript command line utilities')
  .version('0.1.0');

program
  .command('greet')
  .description('Greet a user')
  .argument('[name]', 'name to greet', 'World')
  .option('-u, --uppercase', 'convert greeting to uppercase')
  .action((name: string, options: { uppercase?: boolean }) => {
    greet(name, options.uppercase);
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
      gitChanged(options);
    }
  );

// Files subcommand namespace
const files = program.command('files').description('File manipulation utilities');

const filesFilterCmd = files.command('filter').description('Filter files from stdin');

filesFilterCmd
  .command('suffix')
  .description('Filter files by removing those matching suffix patterns')
  .argument('<suffixes...>', 'suffix patterns to filter out (e.g., .g.dart .gql.dart)')
  .option('-v, --verbose', 'show filter statistics (output to stderr)')
  .action((suffixes: string[], options: { verbose?: boolean }) => {
    filesFilter(suffixes, options);
  });

program.parse();
