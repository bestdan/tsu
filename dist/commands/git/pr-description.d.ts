import type { BaseCommandOptions } from '../../types/command-options.js';
export interface GitPRDescriptionOptions extends BaseCommandOptions {
    baseBranch?: string;
}
export declare function gitPRDescription(options?: GitPRDescriptionOptions): void;
