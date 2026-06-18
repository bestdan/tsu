import type { ChangedFileEntry } from '../changed-files/changed-file-entry.js';
export interface GetFilesToPushWithStatusOptions {
    cwd?: string;
    baseBranch?: string;
}
export declare function getFilesToPushWithStatus(options?: GetFilesToPushWithStatusOptions): ChangedFileEntry[] | null;
