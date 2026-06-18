import { getChangedFilesWithStatus } from './get-changed-files-with-status.js';
import { getFilesToPushWithStatus } from '../range/get-files-to-push-with-status.js';
import type { ChangedFileEntry } from './changed-file-entry.js';
import type { ChangeType } from './get-changed-files.js';
import type { ChangedFilesOptions } from '../../../../types/command-options.js';

/**
 * Gets changed files with their git change status, mirroring the selection
 * logic of {@link getAllChangedFiles} (push / staged / unstaged / all).
 *
 * Callers that only need paths should use {@link getAllChangedFiles}; this
 * variant additionally exposes the change type so callers can decide whether a
 * change can affect path-based ownership.
 *
 * @returns Array of unique changed file entries (deduped by path)
 */
export function getAllChangedFilesWithStatus(
  options: ChangedFilesOptions = {},
  cwd: string = process.cwd()
): ChangedFileEntry[] {
  const baseBranch = options.baseBranch || 'main';

  const shouldUsePush =
    options.push !== false && !options.all && !options.staged && !options.unstaged;

  if (shouldUsePush || options.push) {
    return getFilesToPushWithStatus({ cwd, baseBranch }) || [];
  }

  if (options.all) {
    const committed = getChangedFilesWithStatus({ type: 'committed', baseBranch, cwd }) || [];
    const staged = getChangedFilesWithStatus({ type: 'staged', cwd }) || [];
    const unstaged = getChangedFilesWithStatus({ type: 'unstaged', cwd }) || [];

    // Combine and dedupe by path, keeping the first status seen.
    const byPath = new Map<string, ChangedFileEntry>();
    for (const entry of [...committed, ...staged, ...unstaged]) {
      if (!byPath.has(entry.path)) {
        byPath.set(entry.path, entry);
      }
    }
    return Array.from(byPath.values());
  }

  let type: ChangeType = 'committed';
  if (options.staged) {
    type = 'staged';
  } else if (options.unstaged) {
    type = 'unstaged';
  }

  return getChangedFilesWithStatus({ type, baseBranch, cwd }) || [];
}
