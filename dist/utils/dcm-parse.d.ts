export declare function isDcmVersionWarning(output: string): boolean;
export declare function isOnlyDcmVersionWarning(output: string): boolean;
export declare function handleDcmVersionWarning(output: string): void;
export declare function parseDcmAnalyzeOutput(jsonOutput: string): string[];
export interface CallAndParseDcmOptions {
    cwd: string;
    timeout?: number;
    files?: string[];
}
export interface CallAndParseDcmResult {
    success: boolean;
    filesWithIssues: string[];
    rawOutput?: string;
}
export declare function dcmAnalyze(options: CallAndParseDcmOptions, dcmRunner?: (packageRoot: string, timeout: number) => string): CallAndParseDcmResult;
