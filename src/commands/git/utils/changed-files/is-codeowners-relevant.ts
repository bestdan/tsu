import { basename } from 'node:path';
import type { ChangedFileEntry } from './changed-file-entry.js';

/** File names that define path-based ownership. */
const OWNERSHIP_FILE_NAMES = new Set(['OWNERSHIP', 'CODEOWNERS']);

/**
 * Decides whether a set of changed files can affect path-based ownership, and
 * therefore whether the codeowners check needs to run.
 *
 * Ownership is path-based, so editing the contents of an existing file can
 * never change ownership or create unowned files. A change is relevant only
 * when it:
 * - adds or renames a file (`A`/`R`) — may create newly-unowned files or shift
 *   coverage, or
 * - modifies an OWNERSHIP/CODEOWNERS file — changes the ownership mapping.
 */
export function isCodeownersRelevant(entries: ChangedFileEntry[]): boolean {
  return entries.some(
    (entry) =>
      entry.status === 'A' || entry.status === 'R' || OWNERSHIP_FILE_NAMES.has(basename(entry.path))
  );
}
