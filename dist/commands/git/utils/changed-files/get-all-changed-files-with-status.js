import { getChangedFilesWithStatus } from './get-changed-files-with-status.js';
import { getFilesToPushWithStatus } from '../range/get-files-to-push-with-status.js';
export function getAllChangedFilesWithStatus(options = {}, cwd = process.cwd()) {
    const baseBranch = options.baseBranch || 'main';
    const shouldUsePush = options.push !== false && !options.all && !options.staged && !options.unstaged;
    if (shouldUsePush || options.push) {
        return getFilesToPushWithStatus({ cwd, baseBranch }) || [];
    }
    if (options.all) {
        const committed = getChangedFilesWithStatus({ type: 'committed', baseBranch, cwd }) || [];
        const staged = getChangedFilesWithStatus({ type: 'staged', cwd }) || [];
        const unstaged = getChangedFilesWithStatus({ type: 'unstaged', cwd }) || [];
        const byPath = new Map();
        for (const entry of [...committed, ...staged, ...unstaged]) {
            if (!byPath.has(entry.path)) {
                byPath.set(entry.path, entry);
            }
        }
        return Array.from(byPath.values());
    }
    let type = 'committed';
    if (options.staged) {
        type = 'staged';
    }
    else if (options.unstaged) {
        type = 'unstaged';
    }
    return getChangedFilesWithStatus({ type, baseBranch, cwd }) || [];
}
