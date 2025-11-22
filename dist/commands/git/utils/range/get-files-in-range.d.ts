export interface GetFilesInRangeOptions {
    range: string;
    cwd?: string;
    filter?: (file: string) => boolean;
}
export declare function getFilesInRange(options: GetFilesInRangeOptions): string[] | null;
//# sourceMappingURL=get-files-in-range.d.ts.map