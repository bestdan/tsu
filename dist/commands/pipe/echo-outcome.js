import * as fs from 'node:fs';
export function pipeEchoOutcome(label, options = {}) {
    const verbose = options.verbose || false;
    let input = '';
    try {
        input = fs.readFileSync(0, 'utf-8').trim();
    }
    catch {
        input = '0';
    }
    const exitCode = parseInt(input, 10);
    if (isNaN(exitCode)) {
        console.error('Error: Invalid exit code received from stdin');
        process.exit(1);
    }
    if (exitCode === 0) {
        console.error(`✅ ${label} passed`);
    }
    else {
        console.error(`❌ ${label} failed`);
        if (verbose) {
            console.error(`Exit code: ${exitCode}`);
        }
    }
    console.log(exitCode);
    process.exit(exitCode);
}
//# sourceMappingURL=echo-outcome.js.map