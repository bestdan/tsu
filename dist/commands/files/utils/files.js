export function filterFilesBySuffix(files, suffixPatterns) {
    if (suffixPatterns.length === 0) {
        return files;
    }
    return files.filter((file) => {
        return !suffixPatterns.some((pattern) => file.endsWith(pattern));
    });
}
//# sourceMappingURL=files.js.map