import { isGitRepo, generatePRDescription } from './utils/git.js';
import { ensureClaudeInstalled } from '../../utils/command-helpers.js';
export function gitPRDescription(options = {}) {
    if (!isGitRepo()) {
        console.error('Error: Not in a git repository');
        process.exit(1);
    }
    ensureClaudeInstalled();
    const baseBranch = options.baseBranch || 'main';
    const verbose = options.verbose || false;
    if (verbose) {
        console.error(`Generating PR description comparing to ${baseBranch} branch...`);
    }
    let description;
    try {
        description = generatePRDescription({ baseBranch });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`Error: ${error.message}`);
        }
        else {
            console.error('Error: Failed to generate PR description');
        }
        process.exit(1);
    }
    if (!description) {
        console.error('Error: Failed to generate PR description');
        process.exit(1);
    }
    console.log(description);
}
//# sourceMappingURL=pr-description.js.map