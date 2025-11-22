import type { ChangedFilesOptions } from '../../../types/command-options.js';
export interface DartHookFixCheckOptions extends ChangedFilesOptions {
    excludeSuffixes?: string[];
}
export declare function dartHookFixCheck(options?: DartHookFixCheckOptions): void;
