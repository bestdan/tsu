/**
 * Type definitions for tsu configuration
 */

/**
 * Timeout configuration for a command (in milliseconds)
 */
export interface TimeoutConfig {
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Configuration for individual hook checks
 */
export interface HookChecksConfig {
  /** Dart format check configuration */
  'dart-format'?: TimeoutConfig;
  /** Dart analysis check configuration */
  'dart-analysis'?: TimeoutConfig;
  /** DCM analyze check configuration */
  'dcm-analyze'?: TimeoutConfig;
  /** GraphQL check configuration */
  graphql?: TimeoutConfig;
  /** Git codeowners check configuration */
  codeowners?: TimeoutConfig;
}

/**
 * Configuration for hook collate command
 */
export interface HookCollateConfig extends TimeoutConfig {
  /** Per-check configuration */
  checks?: HookChecksConfig;
}

/**
 * Configuration for hook commands
 */
export interface HookConfig {
  /** Configuration for collate command */
  collate?: HookCollateConfig;
}

/**
 * Root configuration object
 */
export interface TsuConfig {
  /** Global timeout setting (applies to all commands unless overridden) */
  timeout?: number;
  /** Hook-specific configuration */
  hook?: HookConfig;
}
