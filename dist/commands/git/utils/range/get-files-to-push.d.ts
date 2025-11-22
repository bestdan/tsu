export interface GetFilesToPushOptions {
    cwd?: string;
    baseBranch?: string;
}
export declare function getFilesToPush(options?: GetFilesToPushOptions | string): string[] | null;
