import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled, escapeShellArg } from '../utils/shell.js';
import {
  findAffectedPackages,
  COMMON_DART_CODEGEN_SUFFIXES,
} from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { getChangedFiles } from '../utils/git.js';

export interface DartValidateFormatOptions {
  verbose?: boolean;
  /** Files or directories to validate (defaults to staged files) */
  files?: string[];
  /** Suffixes to exclude from formatting. Defaults to COMMON_DART_CODEGEN_SUFFIXES */
  excludeSuffixes?: string[];
}

/**
 * Validates formatting of Dart files using dart format.
 * Can work with PACKAGE_INDEX to find affected packages or validate specific files.
 */
export function dartValidateFormat(
  options: DartValidateFormatOptions = {}
): void {
  const verbose = options.verbose || false;
  let files = options.files || [];
  const excludeSuffixes = options.excludeSuffixes || [
    ...COMMON_DART_CODEGEN_SUFFIXES,
  ];

  if (verbose) {
    console.error('🎨 Validating Dart formatting...');
  }

  // Check if dart format is available
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
        console.error('✓ No staged Dart files to validate');
      }
      process.exit(0);
    }
  }

  // If specific files are provided, validate those
  if (files.length > 0) {
    // Try package-based validation first
    const affectedPackages = findAffectedPackages(files, cwd);

    if (affectedPackages.size > 0) {
      // Use package-based validation
      validatePackages(affectedPackages, cwd, verbose);
      return;
    }

    // Fall back to file-based validation
    validateFiles(files, excludeSuffixes, cwd, verbose);
    return;
  }

  if (verbose) {
    console.error('✓ No Dart files to validate');
  }
  process.exit(0);
}

/**
 * Validates formatting of packages
 */
function validatePackages(
  packages: Map<string, string>,
  cwd: string,
  verbose: boolean
): void {
  let hasErrors = false;

  for (const [location, packageName] of packages) {
    if (verbose) {
      console.error(`Validating ${packageName}...`);
    }

    const packagePath = resolve(cwd, location);
    if (!existsSync(packagePath)) {
      console.error(`Error: Package path not found: ${packagePath}`);
      hasErrors = true;
      continue;
    }

    try {
      execSync('dart format --set-exit-if-changed .', {
        cwd: packagePath,
        stdio: verbose ? 'inherit' : 'pipe',
      });
      if (verbose) {
        console.error(`✓ ${packageName} formatting OK`);
      }
    } catch {
      console.error(`❌ ${packageName} formatting failed`);
      hasErrors = true;
    }
  }

  if (hasErrors) {
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ All formatting checks passed');
  }
  process.exit(0);
}

/**
 * Validates formatting of specific files
 */
function validateFiles(
  files: string[],
  excludeSuffixes: string[],
  cwd: string,
  verbose: boolean
): void {
  // Filter to only Dart files
  const dartFiles = files
    .filter((file) => file.endsWith('.dart'))
    .map((file) => resolve(cwd, file))
    .filter((file) => existsSync(file));

  // Filter out generated files
  const filesToValidate = filterFilesBySuffix(dartFiles, excludeSuffixes);

  if (filesToValidate.length === 0) {
    if (verbose) {
      console.error('✓ No Dart source files to validate');
    }
    process.exit(0);
  }

  if (verbose) {
    console.error(
      `Validating ${filesToValidate.length} file(s) for formatting...`
    );
  }

  try {
    const fileArgs = filesToValidate.map(escapeShellArg).join(' ');
    execSync(`dart format --set-exit-if-changed ${fileArgs}`, {
      cwd,
      stdio: verbose ? 'inherit' : 'pipe',
    });

    if (verbose) {
      console.error('✓ All files properly formatted');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Formatting check failed');
    if (verbose && error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

