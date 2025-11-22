import { filterFilesBySuffix } from '../utils/files.js';
export function filesFilter(suffixPatterns, options = {}) {
    const verbose = options.verbose || false;
    if (suffixPatterns.length === 0) {
        console.error('Error: At least one suffix pattern is required');
        process.exit(1);
    }
    const stdin = process.stdin;
    let data = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk) => {
        data += chunk;
    });
    stdin.on('end', () => {
        const files = data
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);
        if (files.length === 0) {
            return;
        }
        const filtered = filterFilesBySuffix(files, suffixPatterns);
        if (verbose) {
            console.error(`Filtered ${files.length - filtered.length} files matching patterns: ${suffixPatterns.join(', ')}`);
            console.error(`Remaining files: ${filtered.length}`);
        }
        filtered.forEach((file) => {
            console.log(file);
        });
    });
    if (stdin.isTTY) {
        console.error('Error: This command expects input from stdin (pipe)');
        console.error('Usage: tsutils git changed | tsutils files filter suffix .g.dart');
        process.exit(1);
    }
}
