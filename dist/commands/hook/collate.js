import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { isGitRepo, getAllChangedFiles } from '../git/utils/git.js';
import { isDartPackage } from '../dart/utils/dart.js';
import { ensureCondition } from '../../utils/command-helpers.js';
import { logIfVerbose } from '../../utils/logger.js';
import { setVerbose } from '../../utils/verbose-state.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export function hookCollate(options = {}) {
    const verbose = options.verbose || false;
    setVerbose(verbose);
    logIfVerbose(verbose, '📋 Running pre-push checks...');
    ensureCondition(isGitRepo(), 'Error: Not in a git repository');
    ensureCondition(isDartPackage(), 'Error: Not in a Dart package');
    const cwd = process.cwd();
    const allFiles = getAllChangedFiles(options, cwd);
    const dartFiles = allFiles.filter((file) => file.endsWith('.dart'));
    const graphqlFiles = allFiles.filter((file) => file.endsWith('.graphql'));
    if (dartFiles.length === 0 && graphqlFiles.length === 0) {
        logIfVerbose(verbose, '✓ No Dart or GraphQL files modified');
        process.exit(0);
    }
    const runAll = !options.dartFormat && !options.dartAnalysis && !options.dcmAnalyze && !options.graphql;
    const runDartFormat = runAll || options.dartFormat;
    const runDartAnalysis = runAll || options.dartAnalysis;
    const runDcmAnalyze = runAll || options.dcmAnalyze;
    const runGraphql = runAll || options.graphql;
    const failures = [];
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
    const runHook = (name, command, skipCondition) => {
        if (skipCondition) {
            logIfVerbose(verbose, `⏭️  Skipping ${name} (no relevant files)`);
            return;
        }
        try {
            logIfVerbose(verbose, `\n▶️  Running ${name}...`);
            const args = buildArgs();
            const fullCommand = args.length > 0 ? `${command} ${args.join(' ')}` : command;
            execSync(fullCommand, {
                cwd,
                stdio: verbose ? 'inherit' : 'pipe',
            });
            logIfVerbose(verbose, `✓ ${name} passed`);
        }
        catch {
            failures.push(name);
            logIfVerbose(verbose, `✗ ${name} failed`);
        }
    };
    const getTsuCommand = () => {
        try {
            execSync('which tsu', { stdio: 'pipe' });
            return 'tsu';
        }
        catch {
            const cliPath = join(__dirname, '..', '..', 'cli.js');
            return `node ${cliPath}`;
        }
    };
    const tsu = getTsuCommand();
    if (runDartFormat) {
        runHook('dart format check', `${tsu} hook format check`, dartFiles.length === 0);
    }
    if (runDartAnalysis) {
        runHook('dart analysis check', `${tsu} hook analysis check`, dartFiles.length === 0);
    }
    if (runDcmAnalyze) {
        runHook('DCM analyze check', `${tsu} hook dcm analyze check`, dartFiles.length === 0);
    }
    if (runGraphql) {
        runHook('GraphQL check', `${tsu} hook graphql check`, graphqlFiles.length === 0);
    }
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
//# sourceMappingURL=collate.js.map