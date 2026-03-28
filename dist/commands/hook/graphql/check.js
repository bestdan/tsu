import { execSync } from 'node:child_process';
import { isGitRepo, getGitStatus, getAllChangedFiles } from '../../git/utils/git.js';
import { isDartPackage, COMMON_DART_CODEGEN_SUFFIXES } from '../../dart/utils/dart.js';
import { ensureCondition, displayFileList } from '../../../utils/command-helpers.js';
import { isCommandInstalled } from '../../../utils/shell.js';
import { logIfVerbose } from '../../../utils/logger.js';
import { setVerbose } from '../../../utils/verbose-state.js';
const GRAPHQL_GENERATED_SUFFIXES = new Set(COMMON_DART_CODEGEN_SUFFIXES.filter((suffix) => suffix === '.gql.dart' || suffix === '.fakes.dart'));
export async function dartHookGraphqlCheck(options = {}) {
    const verbose = options.verbose || false;
    const codegenCommands = ['melos run codegen:graphql', 'melos run codegen:graphql:test'];
    setVerbose(verbose);
    logIfVerbose(verbose, '🧪 Checking for modified GraphQL files...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    const cwd = process.cwd();
    const allFiles = getAllChangedFiles(options, cwd);
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
    if (gitStatusBefore === null || gitStatusAfter === null)
        return;
    const changedFiles = getNewlyChangedFiles(gitStatusBefore, gitStatusAfter).filter(isGraphqlOwnedFile);
    if (changedFiles.length > 0) {
        console.error('');
        console.error('⚠️  WARNING: GraphQL fakes need regeneration!');
        console.error('   Modified files:');
        changedFiles.forEach((file) => {
            console.error(`   ${file}`);
        });
        console.error('');
        console.error(`   Run 'melos run codegen:graphql && melos run codegen:graphql:test' and commit changes`);
        process.exit(1);
    }
    logIfVerbose(verbose, '✓ GraphQL fakes are up to date');
    process.exit(0);
}
function parseGitStatusEntries(status) {
    const entries = new Map();
    status
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .forEach((line) => {
        const match = line.match(/^(.{2})\s+(.+)$/);
        if (!match) {
            return;
        }
        const [, state, rawPath] = match;
        if (!state || !rawPath)
            return;
        const normalizedPath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() ?? rawPath : rawPath;
        if (normalizedPath) {
            entries.set(normalizedPath, state);
        }
    });
    return entries;
}
function getNewlyChangedFiles(before, after) {
    const beforeEntries = parseGitStatusEntries(before);
    const afterEntries = parseGitStatusEntries(after);
    return Array.from(afterEntries.entries())
        .filter(([path, state]) => beforeEntries.get(path) !== state)
        .map(([path]) => path);
}
function isGraphqlOwnedFile(file) {
    return Array.from(GRAPHQL_GENERATED_SUFFIXES).some((suffix) => file.endsWith(suffix));
}
