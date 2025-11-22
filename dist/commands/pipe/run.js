import { execSync } from 'node:child_process';
export function pipeRun(command, options = {}) {
    const verbose = options.verbose || false;
    if (verbose) {
        console.error(`Running: ${command}`);
    }
    let exitCode = 0;
    try {
        execSync(command, {
            stdio: 'inherit',
        });
        exitCode = 0;
    }
    catch (error) {
        exitCode =
            error && typeof error === 'object' && 'status' in error
                ? error.status
                : 1;
    }
    console.log(exitCode);
    process.exit(exitCode);
}
//# sourceMappingURL=run.js.map