export interface DataDogSetupOptions {
    verbose?: boolean;
    apiKey?: string;
    site?: string;
    nodeEnv?: string;
}
export declare function dataDogSetup(options?: DataDogSetupOptions): Promise<void>;
