import { getChangedFiles } from './get-changed-files.js';
import { getFilesToPush } from '../range/get-files-to-push.js';
export function getAllChangedFiles(options = {}, cwd = process.cwd()) {
    const baseBranch = options.baseBranch || 'main';
    const shouldUsePush = options.push !== false && !options.all && !options.staged && !options.unstaged;
    if (shouldUsePush || options.push) {
        const pushFiles = getFilesToPush({ cwd, baseBranch });
        return pushFiles || [];
    }
    if (options.all) {
        const committedFiles = getChangedFiles({ type: 'committed', baseBranch, cwd }) || [];
        const stagedFiles = getChangedFiles({ type: 'staged', cwd }) || [];
        const unstagedFiles = getChangedFiles({ type: 'unstaged', cwd }) || [];
        return Array.from(new Set([...committedFiles, ...stagedFiles, ...unstagedFiles]));
    }
    let type = 'committed';
    if (options.staged) {
        type = 'staged';
    }
    else if (options.unstaged) {
        type = 'unstaged';
    }
    const files = getChangedFiles({ type, baseBranch, cwd });
    return files || [];
}
//# sourceMappingURL=get-all-changed-files.js.map