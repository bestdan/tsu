/**
 * A git change status code, normalized to its first letter.
 * A = added, M = modified, D = deleted, R = renamed, C = copied.
 */
export type ChangeStatus = 'A' | 'M' | 'D' | 'R' | 'C';

/**
 * A changed file paired with the kind of change git reported for it.
 */
export interface ChangedFileEntry {
  path: string;
  status: ChangeStatus;
}

/**
 * Parses the output of `git diff --name-status` into changed file entries.
 * Renames and copies report `R100\told\tnew`; the destination path is used.
 */
export function parseNameStatus(output: string): ChangedFileEntry[] {
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const parts = line.split('\t');
      const status = (parts[0] ?? '').charAt(0) as ChangeStatus;
      // Renames/copies report `R100\told\tnew`; use the destination path.
      const path = status === 'R' || status === 'C' ? parts[parts.length - 1] : parts[1];
      return { path: path ?? '', status };
    })
    .filter((entry) => entry.path.length > 0);
}
