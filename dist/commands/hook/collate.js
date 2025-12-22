import { execSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import { setVerbose } from '../../utils/verbose-state.js';
const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function hookCollate(options = {}) {
    const verbose = options.verbose || false;
    setVerbose(verbose);
    logIfVerbose(verbose, '📋 Running pre-push checks...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    const cwd = process.cwd();
    const allFiles = getAllChangedFiles(options, cwd);
    const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));
    const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));
    const runAll = !options.dartFormat &&
        !options.dartAnalysis &&
        !options.dcmAnalyze &&
        !options.graphql &&
        !options.codeowners;
    const runDartFormat = runAll || options.dartFormat;
    const runDartAnalysis = runAll || options.dartAnalysis;
    const runDcmAnalyze = runAll || options.dcmAnalyze;
    const runGraphql = runAll || options.graphql;
    const runCodeowners = runAll || options.codeowners;
    if (dartFiles.length === 0 && graphqlFiles.length === 0 && !runCodeowners) {
        logIfVerbose(verbose, '✓ No Dart or GraphQL files modified');
        process.exit(0);
    }
    const buildArgs = () => {
        const args = [];
        if (options.staged)
            args.push('--staged');
        if (options.unstaged)
            args.push('--unstaged');
        if (options.all)
            args.push('--all');
        if (options.baseBranch)
            args.push('--base-branch', options.baseBranch);
        if (verbose)
            args.push('--verbose');
        return args;
    };
    const runHook = async (name, file, args, skipCondition, appendChangedFileArgs) => {
        if (skipCondition) {
            logIfVerbose(verbose, `⏭️  Skipping ${name} (no relevant files)`);
            return { name, passed: true };
        }
        try {
            logIfVerbose(verbose, `\n▶️  Running ${name}...`);
            const cmdArgs = appendChangedFileArgs !== false ? [...args, ...buildArgs()] : [...args];
            const result = await execFileAsync(file, cmdArgs, { cwd });
            if (verbose && result.stdout) {
                process.stderr.write(result.stdout);
            }
            if (verbose && result.stderr) {
                process.stderr.write(result.stderr);
            }
            logIfVerbose(verbose, `✓ ${name} passed`);
            return { name, passed: true };
        }
        catch (error) {
            if (verbose && error && typeof error === 'object') {
                const execError = error;
                if (execError.stdout) {
                    process.stderr.write(execError.stdout);
                }
                if (execError.stderr) {
                    process.stderr.write(execError.stderr);
                }
            }
            logIfVerbose(verbose, `✗ ${name} failed`);
            return { name, passed: false };
        }
    };
    const getTsuCommand = () => {
        try {
            execSync('which tsu', { stdio: 'pipe' });
            return { file: 'tsu', args: [] };
        }
        catch {
            const cliPath = join(__dirname, '..', '..', 'cli.js');
            return { file: 'node', args: [cliPath] };
        }
    };
    const tsuCmd = getTsuCommand();
    const hooks = [];
    if (runDartFormat) {
        hooks.push(runHook('dart format check', tsuCmd.file, [...tsuCmd.args, 'hook', 'format', 'check'], dartFiles.length === 0));
    }
    if (runDartAnalysis) {
        hooks.push(runHook('dart analysis check', tsuCmd.file, [...tsuCmd.args, 'hook', 'analysis', 'check'], dartFiles.length === 0));
    }
    if (runDcmAnalyze) {
        hooks.push(runHook('DCM analyze check', tsuCmd.file, [...tsuCmd.args, 'hook', 'dcm', 'analyze', 'check'], dartFiles.length === 0));
    }
    if (runGraphql) {
        hooks.push(runHook('GraphQL check', tsuCmd.file, [...tsuCmd.args, 'hook', 'graphql', 'check'], graphqlFiles.length === 0));
    }
    if (runCodeowners) {
        const codeownersArgs = [...tsuCmd.args, 'git', 'codeowners', 'check'];
        if (verbose) {
            codeownersArgs.push('--verbose');
        }
        hooks.push(runHook('git codeowners check', tsuCmd.file, codeownersArgs, false, false));
    }
    const results = await Promise.allSettled(hooks);
    const failures = [];
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && !result.value.passed) {
            failures.push(result.value.name);
        }
        else if (result.status === 'rejected') {
            const errorMsg = result.reason instanceof Error ? result.reason.message : String(result.reason);
            failures.push(`Hook execution error: ${errorMsg}`);
            logIfVerbose(verbose, `✗ Unexpected error in hook ${index + 1}: ${errorMsg}`);
        }
    });
    if (failures.length > 0) {
        console.error('');
        console.error('❌ One or more checks failed:');
        failures.forEach((check) => {
            console.error(`  - ${check}`);
        });
        console.error('');
        console.error('Push aborted.');
        process.exit(1);
    }
    logIfVerbose(verbose, '\n✅ All checks passed. Push allowed.');
    process.exit(0);
}
