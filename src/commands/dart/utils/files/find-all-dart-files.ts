import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

/**
 * Finds all Dart files in the project, excluding common build/cache directories.
 * @param rootDir - Root directory to search (defaults to current directory)
 * @returns Array of absolute paths to Dart files, or null on error
 */
export function findAllDartFiles(rootDir: string = process.cwd()): string[] | null {
  try {
    // Find all .dart files, excluding common directories like .dart_tool, build, .symlinks
    const output = execSync(
      'find . -name "*.dart" -type f ' +
        '-not -path "*/.dart_tool/*" ' +
        '-not -path "*/build/*" ' +
        '-not -path "*/.symlinks/*" ' +
        '2>/dev/null',
      {
        cwd: rootDir,
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer for large projects
      }
    ).trim();

    if (!output) {
      return [];
    }

    return output
      .split('\n')
      .filter((file) => file.length > 0)
      .map((file) => resolve(rootDir, file));
  } catch {
    return null;
  }
}
