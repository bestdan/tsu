import { execSync } from 'node:child_process';
import { isGitRepo, getAllChangedFiles, hasUnstagedChanges, } from '../utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES, } from '../utils/dart.js';
import { filterFilesBySuffix } from '../utils/files.js';
import { escapeShellArg } from '../utils/shell.js';
import { ensureCondition, ensureDCMInstalled } from '../utils/command-helpers.js';
export function dartHookDcmCheck(options = {}) {
    const verbose = options.verbose || false;
    const excludeSuffixes = options.excludeSuffixes || [
        ...COMMON_DART_CODEGEN_SUFFIXES,
    ];
    ensureDCMInstalled(verbose);
    if (verbose) {
        console.error('🔧 Running DCM fix on modified files...');
    }
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
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
    if (verbose) {
        console.error(`Running DCM fix on ${modifiedFiles.length} file(s):`);
        modifiedFiles.forEach((file) => {
            console.error(`  ${file}`);
        });
    }
    try {
        const fileArgs = modifiedFiles.map(escapeShellArg).join(' ');
        execSync(`dcm fix ${fileArgs}`, {
            cwd,
            stdio: 'pipe',
        });
    }
    catch (error) {
        console.error('Error: Failed to run dcm fix');
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
    const filesWithChanges = modifiedFiles.filter((file) => hasUnstagedChanges(file, cwd));
    if (filesWithChanges.length > 0) {
        console.error('');
        console.error('❌ Push blocked: DCM fixes were applied. Please stage and commit these changes:');
        filesWithChanges.forEach((file) => {
            console.error(file);
        });
        process.exit(1);
    }
    if (verbose) {
        console.error('✓ All files pass DCM checks');
    }
    process.exit(0);
}
//# sourceMappingURL=dart-hook-dcm-check.js.map