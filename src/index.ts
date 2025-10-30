// Export utilities that can be imported by other packages

// Git utilities
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

// File utilities
export { filterFilesBySuffix } from './utils/files.js';

// Dart utilities
export {
  findDartPackageRoot,
  findFilePackageRoot,
  isDartPackage,
  findAllDartFiles,
} from './utils/dart.js';
