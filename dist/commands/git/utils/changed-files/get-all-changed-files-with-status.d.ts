import type { ChangedFileEntry } from './changed-file-entry.js';
import type { ChangedFilesOptions } from '../../../../types/command-options.js';
export declare function getAllChangedFilesWithStatus(options?: ChangedFilesOptions, cwd?: string): ChangedFileEntry[];
