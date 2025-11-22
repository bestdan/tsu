import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
export function pipeUpdateExitCode(options = {}) {
    const verbose = options.verbose || false;
    const reset = options.reset || false;
    const exitCodeFile = path.join(os.tmpdir(), 'tsu-pipe-accumulated-exit-code');
    if (reset) {
        if (fs.existsSync(exitCodeFile)) {
            fs.unlinkSync(exitCodeFile);
        }
        if (verbose) {
            console.error('Reset accumulated exit code');
        }
        console.log(0);
        process.exit(0);
    }
    let currentExitCode = 0;
    try {
        const input = fs.readFileSync(0, 'utf-8').trim();
        currentExitCode = parseInt(input, 10);
        if (isNaN(currentExitCode)) {
            currentExitCode = 0;
        }
    }
    catch {
        currentExitCode = 0;
    }
    let accumulatedExitCode = 0;
    if (fs.existsSync(exitCodeFile)) {
        try {
            const fileContent = fs.readFileSync(exitCodeFile, 'utf-8').trim();
            accumulatedExitCode = parseInt(fileContent, 10);
            if (isNaN(accumulatedExitCode)) {
                accumulatedExitCode = 0;
            }
        }
        catch {
            accumulatedExitCode = 0;
        }
    }
    if (currentExitCode !== 0 || accumulatedExitCode !== 0) {
        accumulatedExitCode = 1;
    }
    fs.writeFileSync(exitCodeFile, accumulatedExitCode.toString(), 'utf-8');
    if (verbose) {
        console.error(`Accumulated exit code: ${accumulatedExitCode}`);
    }
    console.log(accumulatedExitCode);
    process.exit(accumulatedExitCode);
}
//# sourceMappingURL=update-exit-code.js.map