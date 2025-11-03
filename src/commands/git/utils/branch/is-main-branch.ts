import { getCurrentBranch } from '../repo/get-current-branch.js';

/**
 * Checks if the current branch is the main branch.
 * @param mainBranch - The name of the main branch to check against. Defaults to 'main'
 * @param cwd - The directory to check. Defaults to process.cwd()
 * @returns true if on main branch, false otherwise
 */
export function isMainBranch(
  mainBranch = 'main',
  cwd: string = process.cwd()
): boolean {
  const currentBranch = getCurrentBranch(cwd);
  return currentBranch === mainBranch;
}
