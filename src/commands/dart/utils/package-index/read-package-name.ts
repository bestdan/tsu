import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads package name from pubspec.yaml file.
 * @param packageRoot - Path to the package root directory
 * @returns Package name or null if not found
 */
export function readPackageName(packageRoot: string): string | null {
  const pubspecPath = join(packageRoot, 'pubspec.yaml');
  if (!existsSync(pubspecPath)) {
    return null;
  }

  try {
    const content = readFileSync(pubspecPath, 'utf-8');
    // Simple regex to extract name field from pubspec.yaml
    const nameMatch = content.match(/^name:\s*(.+)$/m);
    if (nameMatch && nameMatch[1]) {
      return nameMatch[1].trim();
    }
    /* v8 ignore next -- @preserve */
    return null;
  } catch {
    return null;
  }
}
