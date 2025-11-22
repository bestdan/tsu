import { execSync } from 'node:child_process';
import { isGitRepo, hasUnstagedChanges, } from '../../../git/utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES, } from '../../utils/dart.js';
import { filterFilesBySuffix } from '../../../files/utils/files.js';
import { escapeShellArg } from '../../../../utils/shell.js';
import { logIfVerbose } from '../../../../utils/logger.js';
import { ensureCondition, getHookChangedFiles, displayFileList, } from '../../../../utils/command-helpers.js';
export function dartHookFormatCheck(options = {}) {
    const verbose = options.verbose || false;
    const excludeSuffixes = options.excludeSuffixes || [
        ...COMMON_DART_CODEGEN_SUFFIXES,
    ];
    logIfVerbose(verbose, '🎨 Running dart format on modified files...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    const cwd = process.cwd();
    const allFiles = getHookChangedFiles({ files: options.files, verbose, cwd });
    const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));
    const modifiedFiles = filterFilesBySuffix(dartFiles, excludeSuffixes);
    if (modifiedFiles.length === 0) {
        logIfVerbose(verbose, '✓ No Dart source files modified');
        process.exit(0);
    }
    displayFileList({
        files: modifiedFiles,
        verbose,
        message: 'Running dart format on',
    });
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
    logIfVerbose(verbose, '✓ All files properly formatted');
    process.exit(0);
}
//# sourceMappingURL=check.js.map