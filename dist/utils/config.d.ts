import type { TsuConfig } from '../types/config.js';
export declare function loadConfig(startPath?: string): TsuConfig | null;
export declare function getTimeoutFromConfig(config: TsuConfig | null, commandPath: string[], checkName?: string): number | undefined;
