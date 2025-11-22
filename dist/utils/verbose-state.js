let verboseMode = false;
export function setVerbose(enabled) {
    verboseMode = enabled;
}
export function isVerbose() {
    return verboseMode;
}
export function resetVerbose() {
    verboseMode = false;
}
