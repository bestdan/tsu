import { getChangedFiles, type ChangeType } from './get-changed-files.js';
import { getFilesToPush } from '../range/get-files-to-push.js';
import type { ChangedFilesOptions } from '../../../../types/command-options.js';

/**
 * Gets changed files based on options, similar to the 'git changed' command.
 * Supports filtering by type (committed, staged, unstaged) or getting files to push.
 *
 * @param options - Configuration options
 * @param options.push - Get files in commits that would be pushed (default: true)
 * @param options.staged - Get only staged changes
 * @param options.unstaged - Get only unstaged changes
 * @param options.all - Get all changes (committed, staged, unstaged) combined
 * @param options.baseBranch - Base branch to compare against for committed changes (default: 'main')
 * @param options.verbose - Not used in this function, included for interface compatibility
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns Array of unique file paths
 *
 * @example
 * // Get files to push (default behavior)
 * const filesToPush = getAllChangedFiles();
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

  // Default to --push if no specific type is requested
  const shouldUsePush =
    options.push !== false &&
    !options.all &&
    !options.staged &&
    !options.unstaged;

  // Handle --push option (default behavior)
  if (shouldUsePush || options.push) {
    const pushFiles = getFilesToPush({ cwd, baseBranch });
    return pushFiles || [];
  }

  // If --all is specified, get all changes
  if (options.all) {
    const committedFiles =
      getChangedFiles({ type: 'committed', baseBranch, cwd }) || [];
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
