import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled, escapeShellArg } from '../utils/shell.js';
import { findAffectedPackages, COMMON_DART_CODEGEN_SUFFIXES, } from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { getChangedFiles } from '../utils/git.js';
export function dartValidateFormat(options = {}) {
    const verbose = options.verbose || false;
    let files = options.files || [];
    const excludeSuffixes = options.excludeSuffixes || [
        ...COMMON_DART_CODEGEN_SUFFIXES,
    ];
    if (verbose) {
        console.error('🎨 Validating Dart formatting...');
    }
    ensureCondition(isCommandInstalled('dart'), 'Error: dart command not found. Please install Dart SDK.');
    const cwd = process.cwd();
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
    if (files.length > 0) {
        const affectedPackages = findAffectedPackages(files, cwd);
        if (affectedPackages.size > 0) {
            validatePackages(affectedPackages, cwd, verbose);
            return;
        }
        validateFiles(files, excludeSuffixes, cwd, verbose);
        return;
    }
    if (verbose) {
        console.error('✓ No Dart files to validate');
    }
    process.exit(0);
}
function validatePackages(packages, cwd, verbose) {
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
        }
        catch {
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
function validateFiles(files, excludeSuffixes, cwd, verbose) {
    const dartFiles = files
        .filter((file) => file.endsWith('.dart'))
        .map((file) => resolve(cwd, file))
        .filter((file) => existsSync(file));
    const filesToValidate = filterFilesBySuffix(dartFiles, excludeSuffixes);
    if (filesToValidate.length === 0) {
        if (verbose) {
            console.error('✓ No Dart source files to validate');
        }
        process.exit(0);
    }
    if (verbose) {
        console.error(`Validating ${filesToValidate.length} file(s) for formatting...`);
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
    }
    catch (error) {
        if (error instanceof Error && /^process\.exit\(\d+\)$/.test(error.message)) {
            throw error;
        }
        console.error('❌ Formatting check failed');
        if (verbose && error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=dart-validate-format.js.map