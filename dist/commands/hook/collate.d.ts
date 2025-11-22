import type { ChangedFilesOptions } from '../../types/command-options.js';
export interface HookCollateOptions extends ChangedFilesOptions {
    dartFormat?: boolean;
    dartAnalysis?: boolean;
    dcmAnalyze?: boolean;
    graphql?: boolean;
}
export declare function hookCollate(options?: HookCollateOptions): void;
//# sourceMappingURL=collate.d.ts.map