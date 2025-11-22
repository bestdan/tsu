import type { CheckCommandOptions } from '../../types/command-options.js';
export interface GitIsMainOptions extends CheckCommandOptions {
    branch?: string;
}
export declare function gitIsMain(path: string | undefined, options?: GitIsMainOptions): void;
