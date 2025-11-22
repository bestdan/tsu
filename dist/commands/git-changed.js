import { isGitRepo } from '../utils/git.js';
import { displayChangedFiles } from '../utils/command-helpers.js';
export function gitChanged(options = {}) {
    if (!isGitRepo()) {
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    displayChangedFiles(options);
}
//# sourceMappingURL=git-changed.js.map