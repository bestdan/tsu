export function parseGitStatusEntries(status) {
    const entries = new Map();
    status
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.length > 0)
        .forEach((line) => {
        const match = line.match(/^(.{2})\s+(.+)$/);
        if (!match) {
            return;
        }
        const [, state, rawPath] = match;
        if (!state || !rawPath)
            return;
        const normalizedPath = rawPath.includes(' -> ')
            ? (rawPath.split(' -> ').pop() ?? rawPath)
            : rawPath;
        if (normalizedPath) {
            entries.set(normalizedPath, state);
        }
    });
    return entries;
}
export function getNewlyChangedFiles(before, after) {
    const beforeEntries = parseGitStatusEntries(before);
    const afterEntries = parseGitStatusEntries(after);
    return Array.from(afterEntries.entries())
        .filter(([path, state]) => beforeEntries.get(path) !== state)
        .map(([path]) => path);
}
