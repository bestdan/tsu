import { execSync } from 'node:child_process';
export function escapeShellArg(arg) {
    return "'" + arg.replace(/'/g, "'\\''") + "'";
}
export function isCommandInstalled(command) {
    try {
        execSync(`command -v ${escapeShellArg(command)}`, {
            stdio: 'pipe',
        });
        return true;
    }
    catch {
        return false;
    }
}
