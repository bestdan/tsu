// Export utilities that can be imported by other packages

// Git utilities
export {
  isGitRepo,
  getGitRoot,
  getChangedFiles,
  getAllChangedFiles,
  getCurrentBranch,
  getStagedDiff,
  getBranchDiff,
  isMainBranch,
  generateCommitMessage,
  generatePRDescription,
  createCommit,
  hasUnstagedChanges,
  type ChangeType,
  type GetChangedFilesOptions,
  type GenerateCommitMessageOptions,
  type GeneratePRDescriptionOptions,
  type CreateCommitOptions,
} from './utils/git.js';

// Shell utilities
export { escapeShellArg } from './utils/shell.js';

// File utilities
export { filterFilesBySuffix } from './utils/files.js';

// Command helper utilities
export {
  displayChangedFiles,
  getChangedFilesWithOptions,
  type DisplayChangedFilesOptions,
} from './utils/command-helpers.js';

// Dart utilities
export {
  findDartPackageRoot,
  findFilePackageRoot,
  isDartPackage,
  findAllDartFiles,
} from './utils/dart.js';

// Dart hook utilities
export {
  dartHookFormatCheck,
  COMMON_DART_CODEGEN_SUFFIXES,
  type DartHookFormatCheckOptions,
} from './commands/dart-hook-format-check.js';
