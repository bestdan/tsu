import { execSync } from 'node:child_process';
export function escapeShellArg(arg) {
    return "'" + arg.replace(/'/g, "'\\''") + "'";
}
export function isSafeShellInput(input) {
    const safePattern = /^[a-zA-Z0-9._/\s-]+$/;
    return safePattern.test(input);
}
export function safeShellArg(arg, allowUnsafe = false) {
    if (!allowUnsafe && !isSafeShellInput(arg)) {
        throw new Error(`Unsafe shell argument detected: "${arg}". Contains potentially dangerous characters.`);
    }
    return escapeShellArg(arg);
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
