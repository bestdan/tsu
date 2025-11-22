export interface DartFixOptions {
    verbose?: boolean;
    files?: string[];
    apply?: boolean;
    packages?: boolean;
}
export declare function dartFix(options?: DartFixOptions): void;
