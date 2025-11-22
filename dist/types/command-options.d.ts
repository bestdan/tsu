export interface BaseCommandOptions {
    verbose?: boolean;
}
export interface CheckCommandOptions extends BaseCommandOptions {
}
export interface GetValueCommandOptions extends BaseCommandOptions {
}
export interface ChangedFilesOptions extends BaseCommandOptions {
    staged?: boolean;
    unstaged?: boolean;
    all?: boolean;
    push?: boolean;
    baseBranch?: string;
}
//# sourceMappingURL=command-options.d.ts.map