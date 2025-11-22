export interface CreateCommitOptions {
    message: string;
    cwd?: string;
}
export declare function createCommit(options: CreateCommitOptions): boolean;
