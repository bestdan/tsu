import { isGitRepo, } from '../../../../git/utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES, } from '../../../utils/dart.js';
import { filterFilesBySuffix } from '../../../../files/utils/files.js';
import { ensureCondition, ensureDCMInstalled, getHookChangedFiles, displayFileList, } from '../../../../../utils/command-helpers.js';
import { logIfVerbose } from '../../../../../utils/logger.js';
import { dcmAnalyze } from '../../../../../utils/dcm-parse.js';
export function dartHookDcmAnalyzeCheck(options = {}) {
    const verbose = options.verbose || false;
    const excludeSuffixes = options.excludeSuffixes || [
        ...COMMON_DART_CODEGEN_SUFFIXES,
    ];
    ensureDCMInstalled(verbose);
    logIfVerbose(verbose, '🔍 Running DCM analyze on modified files...');
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
        message: 'Running DCM analyze on',
    });
    const result = dcmAnalyze({ cwd, timeout: 20000, files: modifiedFiles });
    if (!result.success) {
        const filesWithIssues = result.filesWithIssues;
        console.error('');
        console.error('❌ Push blocked: DCM analyze found issues in the following file(s):');
        filesWithIssues.forEach((file) => {
            console.error(`  ${file}`);
        });
        console.error('');
        console.error('Run `dcm fix` to fix the issues.');
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ All files pass DCM analyze checks');
    process.exit(0);
}
//# sourceMappingURL=check.js.map