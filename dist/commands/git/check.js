import { isGitRepo, getGitRoot } from './utils/git.js';
export function gitCheck(path, options = {}) {
    const targetPath = path || process.cwd();
    const isRepo = isGitRepo(targetPath);
    const verbose = options.verbose || true;
    if (isRepo) {
        if (verbose) {
            const root = getGitRoot(targetPath);
            console.error(`✓ This is a git repository`);
            console.error(`  Root: ${root}`);
        }
        process.exit(0);
    }
    else {
        if (verbose) {
            console.error(`✗ Not a git repository`);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=check.js.map