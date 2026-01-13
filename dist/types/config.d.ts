export interface TimeoutConfig {
    timeout?: number;
}
export interface HookChecksConfig {
    'dart-format'?: TimeoutConfig;
    'dart-analysis'?: TimeoutConfig;
    'dcm-analyze'?: TimeoutConfig;
    graphql?: TimeoutConfig;
    codeowners?: TimeoutConfig;
}
export interface HookCollateConfig extends TimeoutConfig {
    checks?: HookChecksConfig;
}
export interface HookConfig {
    collate?: HookCollateConfig;
}
export interface TsuConfig {
    timeout?: number;
    hook?: HookConfig;
}
