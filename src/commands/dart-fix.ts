import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled, escapeShellArg } from '../utils/shell.js';
import { findAffectedPackages } from '../utils/dart.js';

export interface DartFixOptions {
  verbose?: boolean;
  /** Files or directories to check (required) */
  files?: string[];
  /** Apply fixes automatically (default: false, just dry-run) */
  apply?: boolean;
  /** Run on packages instead of individual files (default: false) */
  packages?: boolean;
}

/**
 * Runs `dart fix` on Dart code.
 * By default runs on individual files. Use --packages to run on affected packages.
 * By default runs in dry-run mode (--dry-run), use --apply to actually apply fixes.
 */
export function dartFix(options: DartFixOptions = {}): void {
  const verbose = options.verbose || false;
  const apply = options.apply || false;
  const usePackages = options.packages || false;
  const files = options.files || [];

  // Check if dart is installed
  ensureCondition(
    isCommandInstalled('dart'),
    verbose ? '⚠️  Warning: dart not installed, skipping' : '',
    { exitCode: 0 }
  );

  // Check that files were provided
  ensureCondition(
    files.length > 0,
    'Error: No files provided. Use --files to specify files to check.',
    { exitCode: 1 }
  );

  if (verbose) {
    console.error(
      `🔧 Running dart fix ${apply ? '(applying fixes)' : '(dry-run)'} on ${usePackages ? 'packages' : 'files'}...`
    );
  }

  const cwd = process.cwd();

  if (usePackages) {
    // Find affected packages from files
    const affectedPackages = findAffectedPackages(files, cwd);

    if (affectedPackages.size === 0) {
      if (verbose) {
        console.error('✓ No Dart packages to check with dart fix');
      }
      process.exit(0);
    }

    runFixOnPackages(affectedPackages, cwd, verbose, apply);
  } else {
    // Run on individual files
    runFixOnFiles(files, cwd, verbose, apply);
  }
}

/**
 * Runs dart fix on individual files
 */
function runFixOnFiles(
  files: string[],
  cwd: string,
  verbose: boolean,
  apply: boolean
): void {
  if (verbose) {
    console.error(`Running dart fix on ${files.length} file(s)...`);
  }

  try {
    const command = apply ? 'dart fix --apply' : 'dart fix --dry-run';
    const fileArgs = files.map(escapeShellArg).join(' ');
    const result = execSync(`${command} ${fileArgs}`, {
      cwd,
      stdio: verbose ? 'pipe' : 'pipe',
      encoding: 'utf-8',
    });

    // In dry-run mode, dart fix exits with 0 but outputs suggestions
    // Check if there are fixes available
    if (!apply && result.includes('suggested fixes')) {
      console.error('⚠️  Suggested fixes available');
      if (verbose) {
        console.error(result);
      }
      console.error('');
      console.error('💡 Run with --apply to automatically apply fixes');
      process.exit(1);
    }

    if (verbose) {
      console.error('✓ All dart fix checks passed');
      if (result.trim()) {
        console.error(result);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ dart fix failed');
    if (verbose && error instanceof Error) {
      const execError = error as { stdout?: string; stderr?: string };
      if (execError.stdout) console.error(execError.stdout);
      if (execError.stderr) console.error(execError.stderr);
    }
    process.exit(1);
  }
}

/**
 * Runs dart fix on packages
 */
function runFixOnPackages(
  packages: Map<string, string>,
  cwd: string,
  verbose: boolean,
  apply: boolean
): void {
  let hasErrors = false;

  for (const [location, packageName] of packages) {
    if (verbose) {
      console.error(
        `Running dart fix ${apply ? '(applying) ' : '(dry-run) '}on ${packageName}...`
      );
    }

    const packagePath = resolve(cwd, location);
    if (!existsSync(packagePath)) {
      console.error(`Error: Package path not found: ${packagePath}`);
      hasErrors = true;
      continue;
    }

    try {
      const command = apply ? 'dart fix --apply' : 'dart fix --dry-run';
      const result = execSync(command, {
        cwd: packagePath,
        stdio: verbose ? 'pipe' : 'pipe',
        encoding: 'utf-8',
      });

      // In dry-run mode, dart fix exits with 0 but outputs suggestions
      // Check if there are fixes available
      if (!apply && result.includes('suggested fixes')) {
        console.error(`⚠️  ${packageName} has suggested fixes available`);
        if (verbose) {
          console.error(result);
        }
        hasErrors = true;
      } else if (verbose) {
        console.error(`✓ ${packageName} dart fix passed`);
        if (result.trim()) {
          console.error(result);
        }
      }
    } catch (error) {
      console.error(`❌ ${packageName} dart fix failed`);
      if (verbose && error instanceof Error) {
        const execError = error as { stdout?: string; stderr?: string };
        if (execError.stdout) console.error(execError.stdout);
        if (execError.stderr) console.error(execError.stderr);
      }
      hasErrors = true;
    }
  }

  if (hasErrors) {
    if (!apply) {
      console.error('');
      console.error('💡 Run with --apply to automatically apply fixes');
    }
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ All dart fix checks passed');
  }
  process.exit(0);
}
