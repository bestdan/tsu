export type ChangeType = 'committed' | 'staged' | 'unstaged';
export interface GetChangedFilesOptions {
    type?: ChangeType;
    baseBranch?: string;
    cwd?: string;
}
export declare function getChangedFiles(options?: GetChangedFilesOptions): string[] | null;
//# sourceMappingURL=get-changed-files.d.ts.map