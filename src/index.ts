// Export utilities that can be imported by other packages

// Types
export type {
  BaseCommandOptions,
  CheckCommandOptions,
  GetValueCommandOptions,
  ChangedFilesOptions,
} from './types/command-options.js';

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
  callClaude,
  generateCommitMessage,
  generatePRDescription,
  createCommit,
  hasUnstagedChanges,
  type ChangeType,
  type GetChangedFilesOptions,
  type CallClaudeOptions,
  type GenerateCommitMessageOptions,
  type GeneratePRDescriptionOptions,
  type CreateCommitOptions,
} from './commands/git/utils/git.js';

// Shell utilities
export { escapeShellArg, isCommandInstalled } from './utils/shell.js';

// File utilities
export { filterFilesBySuffix } from './commands/files/utils/files.js';

// Command helper utilities
export {
  displayChangedFiles,
  getChangedFilesWithOptions,
  ensureCondition,
  ensureDartInstalled,
  ensureDCMInstalled,
  ensureClaudeInstalled,
  type DisplayChangedFilesOptions,
} from './utils/command-helpers.js';

// Dart utilities
export {
  findDartPackageRoot,
  findFilePackageRoot,
  readPackageName,
  readPackageIndex,
  findAffectedPackages,
  isDartPackage,
  findAllDartFiles,
  TSU_PACKAGE_INDEX,
  COMMON_DART_CODEGEN_SUFFIXES,
  type PackageIndexEntry,
} from './commands/dart/utils/dart.js';

// Dart hook utilities
export {
  dartHookFormatCheck,
  type DartHookFormatCheckOptions,
} from './commands/dart/hook/format/check.js';

export {
  dartHookAnalysisCheck,
  type DartHookAnalysisCheckOptions,
} from './commands/dart/hook/analysis/check.js';

export {
  dartHookDcmCheck,
  type DartHookDcmCheckOptions,
} from './commands/dart/hook/dcm/check.js';

export { dartFix, type DartFixOptions } from './commands/dart/fix.js';