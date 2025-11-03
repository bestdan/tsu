import { getChangedFiles } from './get-changed-files.js';

/**
 * Gets all changed files (committed, staged, and unstaged) combined into a single unique list.
 * @param cwd - The directory to run git commands in. Defaults to process.cwd()
 * @returns Array of unique file paths
 */
export function getAllChangedFiles(cwd: string = process.cwd()): string[] {
  const committedFiles = getChangedFiles({ type: 'committed', cwd }) || [];
  const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
  const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];

  // Combine all changed files and remove duplicates
  return Array.from(
    new Set([...committedFiles, ...stagedFiles, ...unstagedFiles])
  );
}
