import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled } from '../utils/shell.js';
import { findAffectedPackages } from '../utils/dart.js';
import { getChangedFiles } from '../utils/git.js';

export interface DartFixOptions {
  verbose?: boolean;
  /** Files or directories to fix (defaults to staged files) */
  files?: string[];
}

/**
 * Applies Dart fixes using dart fix --apply.
 * Automatically finds Dart packages by locating pubspec.yaml files.
 */
export function dartFix(options: DartFixOptions = {}): void {
  const verbose = options.verbose || false;
  let files = options.files || [];

  if (verbose) {
    console.error('🔧 Applying Dart fixes...');
  }

  // Check if dart fix is available
  ensureCondition(
    isCommandInstalled('dart'),
    'Error: dart command not found. Please install Dart SDK.'
  );

  const cwd = process.cwd();

  // If no files provided, get staged files
  if (files.length === 0) {
    const stagedFiles = getChangedFiles({ type: 'staged', baseBranch: 'main' });
    if (stagedFiles === null) {
      console.error('Error: Failed to get staged files');
      process.exit(1);
    }
    files = stagedFiles.filter((f) => f.endsWith('.dart'));

    if (files.length === 0) {
      if (verbose) {
        console.error('✓ No staged Dart files to fix');
      }
      process.exit(0);
    }
  }

  // Find affected packages from files
  const affectedPackages = findAffectedPackages(files, cwd);

  if (affectedPackages.size === 0) {
    if (verbose) {
      console.error('✓ No Dart packages to fix');
    }
    process.exit(0);
  }

  fixPackages(affectedPackages, cwd, verbose);
}

/**
 * Applies fixes to packages using dart fix --apply
 */
function fixPackages(
  packages: Map<string, string>,
  cwd: string,
  verbose: boolean
): void {
  let hasErrors = false;

  for (const [location, packageName] of packages) {
    if (verbose) {
      console.error(`Applying fixes to ${packageName}...`);
    }

    const packagePath = resolve(cwd, location);
    if (!existsSync(packagePath)) {
      console.error(`Error: Package path not found: ${packagePath}`);
      hasErrors = true;
      continue;
    }

    try {
      execSync('dart fix --apply', {
        cwd: packagePath,
        stdio: verbose ? 'inherit' : 'pipe',
      });
      if (verbose) {
        console.error(`✓ ${packageName} fixes applied`);
      }
    } catch {
      console.error(`❌ ${packageName} fix failed`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ All fixes applied successfully');
  }
  process.exit(0);
}
