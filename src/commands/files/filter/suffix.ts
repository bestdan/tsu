import { filterFilesBySuffix } from '../utils/files.js';
import type { BaseCommandOptions } from '../../../types/command-options.js';
import { logError } from '../../../utils/error-logger.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface FilesFilterOptions extends BaseCommandOptions {}

/**
 * Filters stdin file list by removing files that match the specified suffix patterns.
 * Reads from stdin, filters, and outputs to stdout.
 */
export function filesFilter(suffixPatterns: string[], options: FilesFilterOptions = {}): void {
  const verbose = options.verbose || false;

  if (suffixPatterns.length === 0) {
    const error = new Error('At least one suffix pattern is required');
    logError(error, 'tsu files filter suffix');
    console.error('Error: At least one suffix pattern is required');
    process.exit(1);
  }

  // Read from stdin
  const stdin = process.stdin;
  let data = '';

  stdin.setEncoding('utf8');

  stdin.on('data', (chunk) => {
    data += chunk;
  });

  stdin.on('end', () => {
    // Parse input lines
    const files = data
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (files.length === 0) {
      // No input, exit silently
      return;
    }

    // Filter files
    const filtered = filterFilesBySuffix(files, suffixPatterns);

    if (verbose) {
      console.error(
        `Filtered ${files.length - filtered.length} files matching patterns: ${suffixPatterns.join(', ')}`
      );
      console.error(`Remaining files: ${filtered.length}`);
    }

    // Output filtered files to stdout
    filtered.forEach((file) => {
      console.log(file);
    });
  });

  // Handle case where stdin is not piped (TTY)
  if (stdin.isTTY) {
    const error = new Error('This command expects input from stdin (pipe)');
    logError(error, `tsu files filter suffix ${suffixPatterns.join(' ')}`);
    console.error('Error: This command expects input from stdin (pipe)');
    console.error('Usage: tsu git changed | tsu files filter suffix .g.dart');
    process.exit(1);
  }
}
