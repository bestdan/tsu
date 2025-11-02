import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled } from '../utils/shell.js';
import { findAffectedPackages } from '../utils/dart.js';
import { getChangedFiles } from '../utils/git.js';

export interface DartValidateDcmOptions {
  verbose?: boolean;
  /** Files or directories to validate (defaults to staged files) */
  files?: string[];
}

/**
 * Validates Dart code using DCM (Dart Code Metrics).
 * Can work with PACKAGE_INDEX to find affected packages or validate specific directories.
 */
export function dartValidateDcm(options: DartValidateDcmOptions = {}): void {
  const verbose = options.verbose || false;
  let files = options.files || [];

  // Check if DCM is installed
  ensureCondition(
    isCommandInstalled('dcm'),
    verbose ? '⚠️  Warning: DCM not installed, skipping' : '',
    { exitCode: 0 }
  );

  if (verbose) {
    console.error('🔧 Running DCM analysis...');
  }

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
        console.error('✓ No staged Dart files to analyze with DCM');
      }
      process.exit(0);
    }
  }

  // Find affected packages from files
  const affectedPackages = findAffectedPackages(files, cwd);

  if (affectedPackages.size === 0) {
    if (verbose) {
      console.error('✓ No Dart packages to analyze with DCM');
    }
    process.exit(0);
  }

  validatePackages(affectedPackages, cwd, verbose);
}

/**
 * Validates packages using DCM
 */
function validatePackages(
  packages: Map<string, string>,
  cwd: string,
  verbose: boolean
): void {
  let hasErrors = false;

  for (const [location, packageName] of packages) {
    if (verbose) {
      console.error(`Analyzing ${packageName} with DCM...`);
    }

    const packagePath = resolve(cwd, location);
    if (!existsSync(packagePath)) {
      console.error(`Error: Package path not found: ${packagePath}`);
      hasErrors = true;
      continue;
    }

    try {
      execSync('dcm analyze', {
        cwd: packagePath,
        stdio: verbose ? 'inherit' : 'pipe',
      });
      if (verbose) {
        console.error(`✓ ${packageName} DCM analysis passed`);
      }
    } catch (error) {
      console.error(`❌ ${packageName} DCM analysis failed`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ All DCM checks passed');
  }
  process.exit(0);
}
