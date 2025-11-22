import { execSync } from 'node:child_process';
import { isGitRepo, getAllChangedFiles, hasUnstagedChanges, } from '../utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES, } from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { escapeShellArg } from '../utils/shell.js';
export function dartHookFormatCheck(options = {}) {
    const verbose = options.verbose || false;
    const excludeSuffixes = options.excludeSuffixes || [
        ...COMMON_DART_CODEGEN_SUFFIXES,
    ];
    if (verbose) {
        console.error('🎨 Running dart format on modified files...');
    }
    if (!isGitRepo()) {
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    if (!isDartPackage()) {
        console.error('Error: Not in a Dart package');
        process.exit(1);
    }
    const cwd = process.cwd();
    const allChangedFiles = getAllChangedFiles(cwd);
    const dartFiles = allChangedFiles.filter((file) => file.endsWith('.dart'));
    const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);
    if (modifiedFiles.length === 0) {
        if (verbose) {
            console.error('✓ No Dart source files modified');
        }
        process.exit(0);
    }
    try {
        const fileArgs = modifiedFiles.map(escapeShellArg).join(' ');
        execSync(`dart format ${fileArgs}`, {
            cwd,
            stdio: 'pipe',
        });
    }
    catch (error) {
        console.error('Error: Failed to run dart format');
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
    const filesWithChanges = modifiedFiles.filter((file) => hasUnstagedChanges(file, cwd));
    if (filesWithChanges.length > 0) {
        console.error('');
        console.error('❌ Push blocked: Files were formatted. Please stage and commit these changes:');
        filesWithChanges.forEach((file) => {
            console.error(file);
        });
        process.exit(1);
    }
    if (verbose) {
        console.error('✓ All files properly formatted');
    }
    process.exit(0);
}
//# sourceMappingURL=dart-hook-format-check.js.map