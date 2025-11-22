import type { CheckCommandOptions } from '../../types/command-options.js';
export interface GitCheckOptions extends CheckCommandOptions {
}
export declare function gitCheck(path?: string, options?: GitCheckOptions): void;
