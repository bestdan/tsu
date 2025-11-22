export declare function isGitRepo(cwd?: string): boolean;
export declare function getGitRoot(cwd?: string): string | null;
export type ChangeType = 'committed' | 'staged' | 'unstaged';
export interface GetChangedFilesOptions {
    type?: ChangeType;
    baseBranch?: string;
    cwd?: string;
}
export declare function getChangedFiles(options?: GetChangedFilesOptions): string[] | null;
export declare function getAllChangedFiles(cwd?: string): string[];
export declare function getCurrentBranch(cwd?: string): string | null;
export declare function getStagedDiff(cwd?: string): string | null;
export declare function getBranchDiff(baseBranch?: string, cwd?: string): string | null;
export declare function isMainBranch(mainBranch?: string, cwd?: string): boolean;
export interface GenerateCommitMessageOptions {
    cwd?: string;
}
export declare function generateCommitMessage(options?: GenerateCommitMessageOptions): string | null;
export interface GeneratePRDescriptionOptions {
    baseBranch?: string;
    cwd?: string;
}
export declare function generatePRDescription(options?: GeneratePRDescriptionOptions): string | null;
export interface CreateCommitOptions {
    message: string;
    cwd?: string;
}
export declare function createCommit(options: CreateCommitOptions): boolean;
export declare function hasUnstagedChanges(file?: string, cwd?: string): boolean;
export declare function getGitStatus(cwd?: string): string | null;
//# sourceMappingURL=git.d.ts.map