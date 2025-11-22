import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Get the current installed version of tsutils from package.json
 * @returns The current version string
 */
export function getCurrentVersion(): string {
  try {
    // In ESM, __dirname is not available, so we need to construct it
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Go up from src/utils to the root directory
    const packageJsonPath = join(__dirname, '..', '..', 'package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.version;
  } catch {
    throw new Error('Failed to read current version from package.json');
  }
}

/**
 * Fetch the latest release version from GitHub
 * @param owner - GitHub repository owner
 * @param repo - GitHub repository name
 * @returns The latest version string (without 'v' prefix)
 */
export async function getLatestGitHubVersion(owner: string, repo: string): Promise<string> {
  try {
    const url = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'tsutils-cli',
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.statusText}`);
    }

    const data = (await response.json()) as { tag_name: string };
    // Remove 'v' prefix if present
    return data.tag_name.replace(/^v/, '');
  } catch (error) {
    throw new Error(`Failed to fetch latest version from GitHub: ${error}`);
  }
}

/**
 * Compare two semver version strings
 * @param current - Current version string
 * @param latest - Latest version string
 * @returns -1 if current < latest, 0 if equal, 1 if current > latest
 */
export function compareVersions(current: string, latest: string): number {
  const parseCurrent = current.split('.').map(Number);
  const parseLatest = latest.split('.').map(Number);

  for (let i = 0; i < Math.max(parseCurrent.length, parseLatest.length); i++) {
    const c = parseCurrent[i] || 0;
    const l = parseLatest[i] || 0;

    if (c < l) return -1;
    if (c > l) return 1;
  }

  return 0;
}

/**
 * Check if an update is available
 * @param owner - GitHub repository owner
 * @param repo - GitHub repository name
 * @returns Object with update status and version information
 */
export async function checkForUpdate(
  owner: string,
  repo: string
): Promise<{
  updateAvailable: boolean;
  currentVersion: string;
  latestVersion: string;
}> {
  const currentVersion = getCurrentVersion();
  const latestVersion = await getLatestGitHubVersion(owner, repo);
  const comparison = compareVersions(currentVersion, latestVersion);

  return {
    updateAvailable: comparison < 0,
    currentVersion,
    latestVersion,
  };
}

/**
 * Detect which package manager was used to install tsutils globally
 * @returns The detected package manager or null if not found
 */
/* v8 ignore next -- @preserve */
export function detectPackageManager(): 'npm' | 'pnpm' | 'yarn' | null {
  try {
    // Check which package manager has tsutils installed
    const whichTsu = execSync('which tsu', { encoding: 'utf-8' }).trim();

    if (whichTsu.includes('/Library/pnpm/') || whichTsu.includes('/.local/share/pnpm/')) {
      return 'pnpm';
    }
    if (whichTsu.includes('/.yarn/') || whichTsu.includes('/Yarn/')) {
      return 'yarn';
    }
    if (whichTsu.includes('/lib/node_modules/') || whichTsu.includes('/.npm/')) {
      return 'npm';
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Upgrade tsutils by installing from GitHub
 * @param owner - GitHub repository owner
 * @param repo - GitHub repository name
 * @param packageManager - Package manager to use (npm, pnpm, or yarn). If not provided, will try to detect, defaulting to pnpm.
 */
/* v8 ignore next -- @preserve */
export function upgradeFromGitHub(
  owner: string,
  repo: string,
  packageManager?: 'npm' | 'pnpm' | 'yarn'
): void {
  // Auto-detect package manager if not specified, defaulting to pnpm
  const pm = packageManager || detectPackageManager() || 'pnpm';
  const githubUrl = `github:${owner}/${repo}`;

  let command: string;
  switch (pm) {
    case 'pnpm':
      command = `pnpm add -g ${githubUrl}`;
      break;
    case 'yarn':
      command = `yarn global add ${githubUrl}`;
      break;
    case 'npm':
    default:
      command = `npm install -g ${githubUrl}`;
      break;
  }

  try {
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    throw new Error(`Failed to upgrade using ${pm}: ${error}`);
  }
}
