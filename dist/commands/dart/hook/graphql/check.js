import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus, } from '../../../git/utils/git.js';
import { isDartPackage } from '../../utils/dart.js';
import { ensureCondition, getHookChangedFiles, displayFileList, } from '../../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../../utils/shell.js';
import { logIfVerbose } from '../../../../utils/logger.js';
export async function dartHookGraphqlCheck(options = {}) {
    const verbose = options.verbose || false;
    const codegenCommands = [
        'melos run codegen:graphql',
        'melos run codegen:graphql:test',
    ];
    logIfVerbose(verbose, '🧪 Checking for modified GraphQL files...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    const cwd = process.cwd();
    const allFiles = getHookChangedFiles({ files: options.files, verbose, cwd });
    const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));
    ensureCondition(graphqlFiles.length > 0, verbose ? '✓ No GraphQL files modified (skipping)' : '', { exitCode: 0 });
    displayFileList({
        files: graphqlFiles,
        verbose,
        message: 'Running GraphQL codegen on',
    });
    ensureCondition(isCommandInstalled('melos'), verbose ? '⚠️  Warning: Melos not installed, skipping' : '', { exitCode: 0 });
    const gitStatusBefore = getGitStatus(cwd);
    ensureCondition(gitStatusBefore !== null, 'Error: Failed to get git status');
    logIfVerbose(verbose, '🔧 Running GraphQL code generation...');
    try {
        for (const command of codegenCommands) {
            execSync(command, {
                cwd,
                stdio: verbose ? 'inherit' : 'pipe',
            });
        }
    }
    catch (error) {
        console.error('Error: Failed to run GraphQL code generation');
        if (error instanceof Error) {
            console.error(error.message);
        }
        process.exit(1);
    }
    const gitStatusAfter = getGitStatus(cwd);
    ensureCondition(gitStatusAfter !== null, 'Error: Failed to get git status');
    if (gitStatusBefore && gitStatusAfter && gitStatusBefore !== gitStatusAfter) {
        console.error('');
        console.error('⚠️  WARNING: GraphQL fakes need regeneration!');
        console.error('   Modified files:');
        try {
            const beforeLines = new Set(gitStatusBefore.split('\n').filter((line) => line.length > 0));
            const afterLines = gitStatusAfter.split('\n').filter((line) => line.length > 0);
            const changedFiles = afterLines.filter((line) => !beforeLines.has(line));
            if (changedFiles.length > 0) {
                changedFiles.forEach((line) => {
                    const match = line.match(/^..\s+(.+)$/);
                    if (match && match[1]) {
                        console.error(`   ${match[1]}`);
                    }
                });
            }
            else {
                console.error('   (Unable to determine changed files)');
            }
        }
        catch {
            console.error('   (Unable to determine changed files)');
        }
        console.error('');
        console.error(`   Run 'melos run codegen:graphql && melos run codegen:graphql:test' and commit changes`);
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ GraphQL fakes are up to date');
    process.exit(0);
}
//# sourceMappingURL=check.js.map