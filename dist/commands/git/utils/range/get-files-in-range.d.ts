export interface GetFilesInRangeOptions {
    range: string;
    cwd?: string;
    filter?: (file: string) => boolean;
}
export declare function getFilesInRange(options: GetFilesInRangeOptions): string[] | null;
