export function parseNameStatus(output) {
    return output
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
        const parts = line.split('\t');
        const status = (parts[0] ?? '').charAt(0);
        const path = status === 'R' || status === 'C' ? parts[parts.length - 1] : parts[1];
        return { path: path ?? '', status };
    })
        .filter((entry) => entry.path.length > 0);
}
