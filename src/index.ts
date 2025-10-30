// Export utilities that can be imported by other packages
export {
  isGitRepo,
  getGitRoot,
  getChangedFiles,
  getCurrentBranch,
  getStagedDiff,
  getBranchDiff,
  isMainBranch,
  generateCommitMessage,
  generatePRDescription,
  createCommit,
  type ChangeType,
  type GetChangedFilesOptions,
  type GenerateCommitMessageOptions,
  type GeneratePRDescriptionOptions,
  type CreateCommitOptions,
} from './utils/git.js';
export { filterFilesBySuffix } from './utils/files.js';
