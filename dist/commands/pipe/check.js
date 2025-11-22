import { execSync } from 'node:child_process';
export function pipeCheck(command, label, options = {}) {
    const verbose = options.verbose || false;
    if (verbose) {
        console.error(`Running: ${command}`);
    }
    try {
        execSync(command, {
            stdio: 'inherit',
        });
        console.log(`✅ ${label} passed`);
        process.exit(0);
    }
    catch (error) {
        const exitCode = error && typeof error === 'object' && 'status' in error ? error.status : 1;
        console.log(`❌ ${label} failed`);
        if (verbose) {
            console.error(`Exit code: ${exitCode}`);
        }
        process.exit(exitCode);
    }
}
//# sourceMappingURL=check.js.map