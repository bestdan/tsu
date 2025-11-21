import { checkForUpdate } from '../../utils/version.js';
import { logIfVerbose } from '../../utils/logger.js';

export interface CheckVersionOptions {
  verbose?: boolean;
}

const GITHUB_OWNER = 'bestdan';
const GITHUB_REPO = 'tsu';

/**
 * Check if tsutils is on the most recent version.
 * Compares the current installed version against the latest GitHub release.
 * Outputs version information to stdout in a parseable format.
 * In verbose mode, also outputs human-readable messages to stderr.
 * Exit code: 0 if up-to-date, 1 if outdated or error
 */
export async function checkVersion(options: CheckVersionOptions = {}): Promise<void> {
  const verbose = options.verbose || false;

  logIfVerbose(verbose, '🔍 Checking for updates...');

  try {
    const { updateAvailable, currentVersion, latestVersion } = await checkForUpdate(
      GITHUB_OWNER,
      GITHUB_REPO
    );

    // Output parseable result to stdout
    console.log(`current: ${currentVersion}`);
    console.log(`latest: ${latestVersion}`);
    console.log(`update_available: ${updateAvailable}`);

    if (verbose) {
      console.error('');
      if (updateAvailable) {
        console.error(`📦 Current version: ${currentVersion}`);
        console.error(`✨ Latest version: ${latestVersion}`);
        console.error(`⚠️  Update available! Run 'tsu upgrade' to update.`);
      } else {
        console.error(`✓ You are on the latest version (${currentVersion})`);
      }
    }

    process.exit(updateAvailable ? 1 : 0);
  } catch (error) {
    // Rethrow if this is a process.exit error from mocking
    if (error instanceof Error && error.message.startsWith('process.exit(')) {
      throw error;
    }
    if (verbose) {
      console.error(`❌ Failed to check for updates: ${error}`);
    }
    process.exit(1);
  }
}
