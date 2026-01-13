import { execSync, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { Listr } from 'listr2';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import { setVerbose } from '../../utils/verbose-state.js';
import { loadConfig, getTimeoutFromConfig } from '../../utils/config.js';
const execFileAsync = promisify(execFile);
function parseFailureOutput(output) {
    const lines = output.split('\n').map((line) => line.trim());
    const files = [];
    let message;
    const patterns = [
        {
            marker: 'Please stage and commit these changes:',
            message: 'Files need formatting',
        },
        {
            marker: 'dart analyze found issues in the following file(s):',
            message: 'dart analyze found issues',
        },
        {
            marker: 'DCM analyze found issues in the following file(s):',
            message: 'DCM analyze found issues',
        },
        {
            marker: 'Modified files:',
            message: 'Files were modified by codegen',
        },
        {
            marker: 'CODEOWNERS files are out of sync!',
            message: 'CODEOWNERS files are out of sync',
        },
        {
            marker: 'There are unowned files in the repository!',
            message: 'Unowned files detected',
        },
    ];
    for (const pattern of patterns) {
        const markerIndex = lines.findIndex((line) => line.includes(pattern.marker));
        if (markerIndex !== -1) {
            message = pattern.message;
            for (let i = markerIndex + 1; i < lines.length; i++) {
                const line = lines[i];
                if (!line || line.startsWith('Run ') || line.startsWith('Please ')) {
                    break;
                }
                const cleanedFile = line.replace(/^[\s-]*/, '').trim();
                if (cleanedFile && !cleanedFile.startsWith('(') && cleanedFile.includes('.')) {
                    files.push(cleanedFile);
                }
            }
            break;
        }
    }
    return { files, message };
}
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export async function hookCollate(options = {}) {
    const verbose = options.verbose || false;
    setVerbose(verbose);
    logIfVerbose(verbose, '📋 Running pre-push checks...');
    const config = options.withConfig ? loadConfig() : null;
    if (config && verbose) {
        logIfVerbose(verbose, '⚙️  Loaded configuration from file');
    }
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
    const createHookTask = (name, file, args, skipCondition = false, appendChangedFileArgs = true, timeoutMs) => {
        return {
            title: name,
            skip: () => {
                if (skipCondition) {
                    return `Skipping ${name} (no relevant files)`;
                }
                return false;
            },
            task: async (ctx, task) => {
                try {
                    const cmdArgs = appendChangedFileArgs ? [...args, ...buildArgs()] : [...args];
                    const execOptions = { cwd };
                    if (timeoutMs) {
                        execOptions.timeout = timeoutMs;
                    }
                    const result = await execFileAsync(file, cmdArgs, execOptions);
                    if (verbose) {
                        const output = [];
                        if (result.stdout) {
                            output.push(result.stdout.trim());
                        }
                        if (result.stderr) {
                            output.push(result.stderr.trim());
                        }
                        if (output.length > 0) {
                            task.output = output.join('\n');
                        }
                    }
                    return `✓ ${name} passed`;
                }
                catch (error) {
                    const execError = error;
                    const combinedOutput = [execError.stdout || '', execError.stderr || ''].join('\n');
                    if (verbose) {
                        const output = [];
                        if (execError.stdout) {
                            output.push(execError.stdout.trim());
                        }
                        if (execError.stderr) {
                            output.push(execError.stderr.trim());
                        }
                        if (output.length > 0) {
                            task.output = output.join('\n');
                        }
                    }
                    const parsed = parseFailureOutput(combinedOutput);
                    const failureDetail = { name };
                    if (parsed.files.length > 0) {
                        failureDetail.files = parsed.files;
                    }
                    if (parsed.message) {
                        failureDetail.message = parsed.message;
                    }
                    ctx.failures = ctx.failures || [];
                    ctx.failures.push(failureDetail);
                    throw new Error(`${name} failed`);
                }
            },
        };
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
    const hookTasks = [];
    if (runDartFormat) {
        const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-format');
        hookTasks.push(createHookTask('dart format check', tsuCmd.file, [...tsuCmd.args, 'hook', 'format', 'check'], dartFiles.length === 0, true, timeout));
    }
    if (runDartAnalysis) {
        const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-analysis');
        hookTasks.push(createHookTask('dart analysis check', tsuCmd.file, [...tsuCmd.args, 'hook', 'analysis', 'check'], dartFiles.length === 0, true, timeout));
    }
    if (runDcmAnalyze) {
        const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dcm-analyze');
        hookTasks.push(createHookTask('DCM analyze check', tsuCmd.file, [...tsuCmd.args, 'hook', 'dcm', 'analyze', 'check'], dartFiles.length === 0, true, timeout));
    }
    if (runGraphql) {
        const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'graphql');
        hookTasks.push(createHookTask('GraphQL check', tsuCmd.file, [...tsuCmd.args, 'hook', 'graphql', 'check'], graphqlFiles.length === 0, true, timeout));
    }
    if (runCodeowners) {
        const codeownersArgs = [...tsuCmd.args, 'git', 'codeowners', 'check'];
        if (verbose) {
            codeownersArgs.push('--verbose');
        }
        const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'codeowners');
        hookTasks.push(createHookTask('git codeowners check', tsuCmd.file, codeownersArgs, false, false, timeout));
    }
    const tasks = new Listr(hookTasks, {
        concurrent: true,
        exitOnError: false,
        renderer: verbose ? 'verbose' : 'default',
        rendererOptions: {
            removeEmptyLines: true,
        },
        ctx: { failures: [] },
    });
    try {
        const ctx = await tasks.run();
        if (ctx.failures && ctx.failures.length > 0) {
            console.error('');
            console.error('❌ One or more checks failed:');
            ctx.failures.forEach((failure) => {
                console.error(`  - ${failure.name}`);
                if (failure.message) {
                    console.error(`    ${failure.message}`);
                }
                if (failure.files && failure.files.length > 0) {
                    failure.files.forEach((file) => {
                        console.error(`      ${file}`);
                    });
                }
            });
            console.error('');
            console.error('Push aborted.');
            process.exit(1);
        }
        logIfVerbose(verbose, '\n✅ All checks passed. Push allowed.');
        process.exit(0);
    }
    catch {
        console.error('');
        console.error('Push aborted.');
        process.exit(1);
    }
}
