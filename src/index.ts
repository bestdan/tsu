// Export utilities that can be imported by other packages
export {
  isGitRepo,
  getGitRoot,
  getChangedFiles,
  getCurrentBranch,
  getStagedDiff,
  generateCommitMessage,
  createCommit,
  type ChangeType,
  type GetChangedFilesOptions,
  type GenerateCommitMessageOptions,
  type CreateCommitOptions,
} from './utils/git.js';
export { filterFilesBySuffix } from './utils/files.js';
