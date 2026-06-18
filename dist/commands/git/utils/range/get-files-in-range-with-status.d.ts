import type { ChangedFileEntry } from '../changed-files/changed-file-entry.js';
export interface GetFilesInRangeWithStatusOptions {
    range: string;
    cwd?: string;
}
export declare function getFilesInRangeWithStatus(options: GetFilesInRangeWithStatusOptions): ChangedFileEntry[] | null;
