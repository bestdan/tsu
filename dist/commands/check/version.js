import { checkForUpdate } from '../../utils/version.js';
import { logIfVerbose } from '../../utils/logger.js';
const GITHUB_OWNER = 'bestdan';
const GITHUB_REPO = 'tsu';
export async function checkVersion(options = {}) {
    const verbose = options.verbose || false;
    logIfVerbose(verbose, '🔍 Checking for updates...');
    try {
        const { updateAvailable, currentVersion, latestVersion } = await checkForUpdate(GITHUB_OWNER, GITHUB_REPO);
        console.log(`current: ${currentVersion}`);
        console.log(`latest: ${latestVersion}`);
        console.log(`update_available: ${updateAvailable}`);
        if (verbose) {
            console.error('');
            if (updateAvailable) {
                console.error(`📦 Current version: ${currentVersion}`);
                console.error(`✨ Latest version: ${latestVersion}`);
                console.error(`⚠️  Update available! Run 'tsu upgrade' to update.`);
            }
            else {
                console.error(`✓ You are on the latest version (${currentVersion})`);
            }
        }
        process.exit(updateAvailable ? 1 : 0);
    }
    catch (error) {
        if (error instanceof Error && error.message.startsWith('process.exit(')) {
            throw error;
        }
        if (verbose) {
            console.error(`❌ Failed to check for updates: ${error}`);
        }
        process.exit(1);
    }
}
