import { isGitRepo, getGitRoot } from './utils/git.js';
import type { CheckCommandOptions } from '../../types/command-options.js';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface GitCheckOptions extends CheckCommandOptions {}

export function gitCheck(path?: string, options: GitCheckOptions = {}): void {
  const targetPath = path || process.cwd();
  const isRepo = isGitRepo(targetPath);
  const verbose = options.verbose || true;

  if (isRepo) {
    if (verbose) {
      const root = getGitRoot(targetPath);
      // Human-readable output to stderr
      console.error(`✓ This is a git repository`);
      console.error(`  Root: ${root}`);
    }
    // Exit with success code
    process.exit(0);
  } else {
    if (verbose) {
      console.error(`✗ Not a git repository`);
    }
    // Exit with failure code
    process.exit(1);
  }
}
