/**
 * Centralized type definitions for command options
 */

/**
 * Basic options for commands that output results
 */
export interface BaseCommandOptions {
  /** Show verbose output to stderr */
  verbose?: boolean;
}

/**
 * Options for commands that check repository state (exit code only)
 * Extends BaseCommandOptions to allow for future additions without breaking changes.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CheckCommandOptions extends BaseCommandOptions {}

/**
 * Options for commands that get a single value (root, branch, etc.)
 * Extends BaseCommandOptions to allow for future additions without breaking changes.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GetValueCommandOptions extends BaseCommandOptions {}

/**
 * Options for commands that work with changed files
 */
export interface ChangedFilesOptions extends BaseCommandOptions {
  /** Show only staged changes */
  staged?: boolean;
  /** Show only unstaged changes */
  unstaged?: boolean;
  /** Show all changes (committed, staged, unstaged) */
  all?: boolean;
  /** Show files in commits that would be pushed to upstream */
  push?: boolean;
  /** Base branch to compare against (default: 'main') */
  baseBranch?: string;
}
