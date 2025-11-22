export interface PipeSeriesOptions {
    verbose?: boolean;
}
export interface CheckCommand {
    command: string;
    label: string;
}
export declare function pipeSeries(checks: CheckCommand[], options?: PipeSeriesOptions): void;
export declare function pipeSeriesFromArgs(args: string[]): CheckCommand[];
//# sourceMappingURL=series.d.ts.map