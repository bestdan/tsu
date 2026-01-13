import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
const CONFIG_FILE_NAMES = [
    '.tsurc',
    '.tsurc.json',
    'tsu.config.json',
    '.tsu.config.json',
];
function findConfigFile(startPath) {
    let currentPath = startPath;
    while (currentPath !== dirname(currentPath)) {
        for (const fileName of CONFIG_FILE_NAMES) {
            const configPath = join(currentPath, fileName);
            if (existsSync(configPath)) {
                return configPath;
            }
        }
        currentPath = dirname(currentPath);
    }
    for (const fileName of CONFIG_FILE_NAMES) {
        const configPath = join(homedir(), fileName);
        if (existsSync(configPath)) {
            return configPath;
        }
    }
    return null;
}
function loadConfigFromFile(configPath) {
    try {
        const content = readFileSync(configPath, 'utf-8');
        const config = JSON.parse(content);
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
}
export function loadConfig(startPath = process.cwd()) {
    const configPath = findConfigFile(startPath);
    if (!configPath) {
        return null;
    }
    return loadConfigFromFile(configPath);
}
export function getTimeoutFromConfig(config, commandPath, checkName) {
    if (!config) {
        return undefined;
    }
    if (checkName && commandPath[0] === 'hook' && commandPath[1] === 'collate') {
        const checkTimeout = config.hook?.collate?.checks?.[checkName]?.timeout;
        if (checkTimeout !== undefined) {
            return checkTimeout;
        }
    }
    if (commandPath[0] === 'hook' && commandPath[1] === 'collate') {
        const collateTimeout = config.hook?.collate?.timeout;
        if (collateTimeout !== undefined) {
            return collateTimeout;
        }
    }
    return config.timeout;
}
