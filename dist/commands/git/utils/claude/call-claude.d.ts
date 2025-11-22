export interface CallClaudeOptions {
    prompt: string;
    input: string;
    cwd?: string;
    postProcess?: (output: string) => string;
}
export declare function callClaude(options: CallClaudeOptions): string;
