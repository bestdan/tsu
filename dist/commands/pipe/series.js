import { execSync } from 'node:child_process';
export function pipeSeries(checks, options = {}) {
    const verbose = options.verbose || false;
    let anyFailed = false;
    for (const check of checks) {
        if (verbose) {
            console.error(`\nRunning: ${check.command}`);
        }
        try {
            execSync(check.command, {
                stdio: 'inherit',
            });
            console.log(`✅ ${check.label} passed`);
        }
        catch (error) {
            anyFailed = true;
            const exitCode = error && typeof error === 'object' && 'status' in error ? error.status : 1;
            console.log(`❌ ${check.label} failed`);
            if (verbose) {
                console.error(`Exit code: ${exitCode}`);
            }
        }
    }
    if (anyFailed) {
        if (verbose) {
            console.error('\n❌ Some checks failed');
        }
        process.exit(1);
    }
    if (verbose) {
        console.error('\n✅ All checks passed');
    }
    process.exit(0);
}
export function pipeSeriesFromArgs(args) {
    if (args.length % 2 !== 0) {
        console.error('Error: Arguments must be pairs of [command, label]');
        console.error('Usage: tsu pipe series <command1> <label1> <command2> <label2> ...');
        process.exit(1);
    }
    const checks = [];
    for (let i = 0; i < args.length; i += 2) {
        checks.push({
            command: args[i],
            label: args[i + 1],
        });
    }
    return checks;
}
//# sourceMappingURL=series.js.map