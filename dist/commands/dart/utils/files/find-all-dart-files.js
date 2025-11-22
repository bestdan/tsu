import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
export function findAllDartFiles(rootDir = process.cwd()) {
    try {
        const output = execSync('find . -name "*.dart" -type f ' +
            '-not -path "*/.dart_tool/*" ' +
            '-not -path "*/build/*" ' +
            '-not -path "*/.symlinks/*" ' +
            '2>/dev/null', {
            cwd: rootDir,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
        }).trim();
        if (!output) {
            return [];
        }
        return output
            .split('\n')
            .filter((file) => file.length > 0)
            .map((file) => resolve(rootDir, file));
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=find-all-dart-files.js.map