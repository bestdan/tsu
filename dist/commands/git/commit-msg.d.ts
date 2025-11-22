import type { BaseCommandOptions } from '../../types/command-options.js';
export interface GitCommitMsgOptions extends BaseCommandOptions {
    commit?: boolean;
}
export declare function gitCommitMsg(options?: GitCommitMsgOptions): void;
