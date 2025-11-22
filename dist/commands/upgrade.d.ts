export interface UpgradeOptions {
    verbose?: boolean;
    packageManager?: 'npm' | 'pnpm' | 'yarn';
}
export declare function upgrade(options?: UpgradeOptions): Promise<void>;
