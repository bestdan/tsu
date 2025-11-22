import { execSync } from 'node:child_process';
import { resolve, dirname, basename } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled, escapeShellArg } from '../utils/shell.js';
import { getChangedFiles } from '../utils/git.js';
export function dartValidateFreezed(options = {}) {
    const verbose = options.verbose || false;
    let files = options.files || [];
    if (verbose) {
        console.error('❄️  Validating freezed files...');
    }
    ensureCondition(isCommandInstalled('dart'), 'Error: dart command not found. Please install Dart SDK.');
    const cwd = process.cwd();
    if (files.length === 0) {
        const stagedFiles = getChangedFiles({ type: 'staged', baseBranch: 'main' });
        if (stagedFiles === null) {
            console.error('Error: Failed to get staged files');
            process.exit(1);
        }
        files = stagedFiles;
    }
    const freezedFiles = files
        .filter((file) => file.includes('features/') &&
        file.endsWith('.dart') &&
        !file.endsWith('.freezed.dart') &&
        !file.endsWith('.g.dart'))
        .map((file) => resolve(cwd, file))
        .filter((file) => existsSync(file));
    if (freezedFiles.length === 0) {
        if (verbose) {
            console.error('✓ No freezed files to validate');
        }
        process.exit(0);
    }
    if (verbose) {
        console.error(`Validating ${freezedFiles.length} freezed file(s) in features/...`);
    }
    let hasErrors = false;
    for (const file of freezedFiles) {
        const content = readFileSync(file, 'utf-8');
        if (!content.includes("import 'package:freezed_annotation/")) {
            if (verbose) {
                console.error(`  Skipping ${basename(file)} (not a freezed file)`);
            }
            continue;
        }
        const fileWithoutExt = file.replace(/\.dart$/, '');
        const generatedFile = `${fileWithoutExt}.freezed.dart`;
        if (!existsSync(generatedFile)) {
            console.error(`❌ Missing generated file for ${basename(file)}: ${basename(generatedFile)}`);
            hasErrors = true;
            continue;
        }
        const packageRoot = findPackageRootForFile(file);
        if (!packageRoot) {
            console.error(`❌ Could not find package root for ${basename(file)}`);
            hasErrors = true;
            continue;
        }
        if (verbose) {
            console.error(`  Checking ${basename(file)}...`);
        }
        try {
            execSync(`dart run build_runner build --delete-conflicting-outputs --build-filter=${escapeShellArg(file)}`, {
                cwd: packageRoot,
                stdio: 'pipe',
            });
            const result = execSync(`git status --porcelain ${escapeShellArg(generatedFile)}`, {
                cwd: packageRoot,
                encoding: 'utf-8',
            });
            if (result.trim().length > 0) {
                console.error(`❌ ${basename(file)}: Generated file is out of date. Please run build_runner.`);
                hasErrors = true;
            }
            else if (verbose) {
                console.error(`  ✓ ${basename(file)} OK`);
            }
        }
        catch (error) {
            console.error(`❌ Failed to validate ${basename(file)}`);
            if (verbose && error instanceof Error) {
                console.error(error.message);
            }
            hasErrors = true;
        }
    }
    if (hasErrors) {
        console.error('');
        console.error('❌ Validation failed: Some freezed files have out-of-date generated files.');
        console.error('Please run: dart run build_runner build');
        process.exit(1);
    }
    if (verbose) {
        console.error('✓ All freezed files are up to date');
    }
    process.exit(0);
}
function findPackageRootForFile(filePath) {
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
//# sourceMappingURL=dart-validate-freezed.js.map