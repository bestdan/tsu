import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
export function getCurrentVersion() {
    try {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const packageJsonPath = join(__dirname, '..', '..', 'package.json');
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.version;
    }
    catch {
        throw new Error('Failed to read current version from package.json');
    }
}
export async function getLatestGitHubVersion(owner, repo) {
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
        const data = (await response.json());
        return data.tag_name.replace(/^v/, '');
    }
    catch (error) {
        throw new Error(`Failed to fetch latest version from GitHub: ${error}`, {
            cause: error,
        });
    }
}
export function compareVersions(current, latest) {
    const parseCurrent = current.split('.').map(Number);
    const parseLatest = latest.split('.').map(Number);
    for (let i = 0; i < Math.max(parseCurrent.length, parseLatest.length); i++) {
        const c = parseCurrent[i] || 0;
        const l = parseLatest[i] || 0;
        if (c < l)
            return -1;
        if (c > l)
            return 1;
    }
    return 0;
}
export async function checkForUpdate(owner, repo) {
    const currentVersion = getCurrentVersion();
    const latestVersion = await getLatestGitHubVersion(owner, repo);
    const comparison = compareVersions(currentVersion, latestVersion);
    return {
        updateAvailable: comparison < 0,
        currentVersion,
        latestVersion,
    };
}
export function detectPackageManager() {
    try {
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
    }
    catch {
        return null;
    }
}
function isValidGitHubName(name) {
    return /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(name);
}
export function upgradeFromGitHub(owner, repo, packageManager) {
    if (!isValidGitHubName(owner)) {
        throw new Error(`Invalid GitHub owner: "${owner}". Must be alphanumeric with hyphens/underscores.`);
    }
    if (!isValidGitHubName(repo)) {
        throw new Error(`Invalid GitHub repo: "${repo}". Must be alphanumeric with hyphens/underscores.`);
    }
    const pm = packageManager || detectPackageManager() || 'pnpm';
    const githubUrl = `github:${owner}/${repo}`;
    let command;
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
    }
    catch (error) {
        throw new Error(`Failed to upgrade using ${pm}: ${error}`, { cause: error });
    }
}
