import { execSync } from 'node:child_process';
import { resolve, dirname, basename } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled, escapeShellArg } from '../utils/shell.js';
import { getChangedFiles } from '../utils/git.js';

export interface DartValidateFreezedOptions {
  verbose?: boolean;
  /** Files to validate (should be Dart files in features/ directory, defaults to staged files) */
  files?: string[];
}

/**
 * Validates freezed files to ensure generated files are up to date.
 * Checks non-generated Dart files in features/ directory.
 */
export function dartValidateFreezed(
  options: DartValidateFreezedOptions = {}
): void {
  const verbose = options.verbose || false;
  let files = options.files || [];

  if (verbose) {
    console.error('❄️  Validating freezed files...');
  }

  // Check if build_runner is available (needed for freezed)
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
    files = stagedFiles;
  }

  // Filter to only non-generated Dart files in features/ directory
  const freezedFiles = files
    .filter(
      (file) =>
        file.includes('features/') &&
        file.endsWith('.dart') &&
        !file.endsWith('.freezed.dart') &&
        !file.endsWith('.g.dart')
    )
    .map((file) => resolve(cwd, file))
    .filter((file) => existsSync(file));

  if (freezedFiles.length === 0) {
    if (verbose) {
      console.error('✓ No freezed files to validate');
    }
    process.exit(0);
  }

  if (verbose) {
    console.error(
      `Validating ${freezedFiles.length} freezed file(s) in features/...`
    );
  }

  // For each file, check if it uses freezed and if the generated file exists and is up to date
  let hasErrors = false;

  for (const file of freezedFiles) {
    const content = readFileSync(file, 'utf-8');

    // Check if the file imports freezed_annotation
    if (!content.includes("import 'package:freezed_annotation/")) {
      if (verbose) {
        console.error(`  Skipping ${basename(file)} (not a freezed file)`);
      }
      continue;
    }

    // The generated file should be in the same directory with .freezed.dart suffix
    const fileWithoutExt = file.replace(/\.dart$/, '');
    const generatedFile = `${fileWithoutExt}.freezed.dart`;

    if (!existsSync(generatedFile)) {
      console.error(
        `❌ Missing generated file for ${basename(file)}: ${basename(generatedFile)}`
      );
      hasErrors = true;
      continue;
    }

    // Find the package root for this file
    const packageRoot = findPackageRootForFile(file);
    if (!packageRoot) {
      console.error(
        `❌ Could not find package root for ${basename(file)}`
      );
      hasErrors = true;
      continue;
    }

    // Run build_runner to regenerate and check if it creates changes
    if (verbose) {
      console.error(`  Checking ${basename(file)}...`);
    }

    try {
      // Run build_runner on the specific file
      execSync(
        `dart run build_runner build --delete-conflicting-outputs --build-filter=${escapeShellArg(file)}`,
        {
          cwd: packageRoot,
          stdio: 'pipe',
        }
      );

      // Check if the generated file was modified
      const result = execSync(
        `git status --porcelain ${escapeShellArg(generatedFile)}`,
        {
          cwd: packageRoot,
          encoding: 'utf-8',
        }
      );

      if (result.trim().length > 0) {
        console.error(
          `❌ ${basename(file)}: Generated file is out of date. Please run build_runner.`
        );
        hasErrors = true;
      } else if (verbose) {
        console.error(`  ✓ ${basename(file)} OK`);
      }
    } catch (error) {
      console.error(`❌ Failed to validate ${basename(file)}`);
      if (verbose && error instanceof Error) {
        console.error(error.message);
      }
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.error('');
    console.error(
      '❌ Validation failed: Some freezed files have out-of-date generated files.'
    );
    console.error('Please run: dart run build_runner build');
    process.exit(1);
  }

  if (verbose) {
    console.error('✓ All freezed files are up to date');
  }
  process.exit(0);
}

/**
 * Finds the package root for a given file by walking up the directory tree
 */
function findPackageRootForFile(filePath: string): string | null {
  let currentPath = dirname(filePath);
  const root = resolve('/');

  while (currentPath !== root) {
    const pubspecPath = resolve(currentPath, 'pubspec.yaml');
    if (existsSync(pubspecPath)) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }

  return null;
}
