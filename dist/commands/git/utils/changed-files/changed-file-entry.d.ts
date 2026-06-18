export type ChangeStatus = 'A' | 'M' | 'D' | 'R' | 'C';
export interface ChangedFileEntry {
    path: string;
    status: ChangeStatus;
}
export declare function parseNameStatus(output: string): ChangedFileEntry[];
