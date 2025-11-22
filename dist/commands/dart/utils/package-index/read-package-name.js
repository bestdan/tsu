import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
export function readPackageName(packageRoot) {
    const pubspecPath = join(packageRoot, 'pubspec.yaml');
    if (!existsSync(pubspecPath)) {
        return null;
    }
    try {
        const content = readFileSync(pubspecPath, 'utf-8');
        const nameMatch = content.match(/^name:\s*(.+)$/m);
        if (nameMatch && nameMatch[1]) {
            return nameMatch[1].trim();
        }
        return null;
    }
    catch {
        return null;
    }
}
