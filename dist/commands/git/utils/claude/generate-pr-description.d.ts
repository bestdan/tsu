export interface GeneratePRDescriptionOptions {
    baseBranch?: string;
    cwd?: string;
}
export declare function generatePRDescription(options?: GeneratePRDescriptionOptions): string | null;
