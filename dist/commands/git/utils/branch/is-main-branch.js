import { getCurrentBranch } from '../repo/get-current-branch.js';
export function isMainBranch(mainBranch = 'main', cwd = process.cwd()) {
    const currentBranch = getCurrentBranch(cwd);
    return currentBranch === mainBranch;
}
//# sourceMappingURL=is-main-branch.js.map