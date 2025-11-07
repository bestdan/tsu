import { getChangedFiles, type ChangeType } from './get-changed-files.js';
import type { ChangedFilesOptions } from '../../../../types/command-options.js';

/**
 * Gets changed files based on options, similar to the 'git changed' command.
 * Supports filtering by type (committed, staged, unstaged) or getting all changed files.
 * 
 * @param options - Configuration options
 * @param options.staged - Get only staged changes
 * @param options.unstaged - Get only unstaged changes
 * @param options.all - Get all changes (committed, staged, unstaged) combined
 * @param options.baseBranch - Base branch to compare against for committed changes (default: 'main')
 * @param options.verbose - Not used in this function, included for interface compatibility
 * @param options.push - Not supported by this function (used only in displayChangedFiles)
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns Array of unique file paths
 * 
 * @example
 * // Get all changed files (default behavior)
 * const allFiles = getAllChangedFiles();
 * 
 * @example
 * // Get only staged files
 * const stagedFiles = getAllChangedFiles({ staged: true });
 * 
 * @example
 * // Get committed changes compared to 'develop' branch
 * const committedFiles = getAllChangedFiles({ baseBranch: 'develop' });
 */
export function getAllChangedFiles(
  options: ChangedFilesOptions = {},
  cwd: string = process.cwd()
): string[] {
  const baseBranch = options.baseBranch || 'main';

  // If --all is specified or no specific type is requested, get all changes
  if (options.all || (!options.staged && !options.unstaged)) {
    const committedFiles = getChangedFiles({ type: 'committed', baseBranch, cwd }) || [];
    const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
    const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];

    // Combine all changed files and remove duplicates
    return Array.from(
      new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])
    );
  }

  // Determine which type of changes to get
  let type: ChangeType = 'committed';
  if (options.staged) {
    type = 'staged';
  } else if (options.unstaged) {
    type = 'unstaged';
  }

  const files = getChangedFiles({ type, baseBranch, cwd });
  return files || [];
}
