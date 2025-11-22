import type { ChangedFilesOptions } from '../../../../types/command-options.js';
export interface DartHookDcmAnalyzeCheckOptions extends ChangedFilesOptions {
    excludeSuffixes?: string[];
}
export declare function dartHookDcmAnalyzeCheck(options?: DartHookDcmAnalyzeCheckOptions): void;
