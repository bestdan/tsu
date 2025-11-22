import { checkForUpdate, upgradeFromGitHub, detectPackageManager } from '../utils/version.js';
import { logIfVerbose } from '../utils/logger.js';
const GITHUB_OWNER = 'bestdan';
const GITHUB_REPO = 'tsu';
export async function upgrade(options = {}) {
    const verbose = options.verbose || false;
    const packageManager = options.packageManager || detectPackageManager() || 'pnpm';
    logIfVerbose(verbose, '🔍 Checking for updates...');
    try {
        const { updateAvailable, currentVersion, latestVersion } = await checkForUpdate(GITHUB_OWNER, GITHUB_REPO);
        if (!updateAvailable) {
            logIfVerbose(verbose, `✓ Already on the latest version (${currentVersion})`);
            process.exit(0);
        }
        logIfVerbose(verbose, `📦 Current version: ${currentVersion}`);
        logIfVerbose(verbose, `✨ Latest version: ${latestVersion}`);
        logIfVerbose(verbose, `📥 Upgrading using ${packageManager}...`);
        upgradeFromGitHub(GITHUB_OWNER, GITHUB_REPO, packageManager);
        logIfVerbose(verbose, `✓ Successfully upgraded to version ${latestVersion}`);
        process.exit(0);
    }
    catch (error) {
        if (error instanceof Error && error.message.startsWith('process.exit(')) {
            throw error;
        }
        if (verbose) {
            console.error(`❌ Failed to upgrade: ${error}`);
        }
        process.exit(1);
    }
}
//# sourceMappingURL=upgrade.js.map