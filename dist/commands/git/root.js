import { isGitRepo, getGitRoot } from './utils/git.js';
export function gitRoot(path, options = {}) {
    const targetPath = path || process.cwd();
    const verbose = options.verbose || false;
    if (!isGitRepo(targetPath)) {
        if (verbose) {
            console.error('Error: Not in a git repository');
        }
        process.exit(1);
    }
    const root = getGitRoot(targetPath);
    if (root === null) {
        console.error('Error: Failed to get git root');
        process.exit(1);
    }
    if (verbose) {
        console.error(`Git root: ${root}`);
    }
    console.log(root);
}
//# sourceMappingURL=root.js.map