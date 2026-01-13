/**
 * Configuration file loading utilities
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import type { TsuConfig } from '../types/config.js';

/**
 * Possible config file names, in order of preference
 */
const CONFIG_FILE_NAMES = ['.tsurc', '.tsurc.json', 'tsu.config.json', '.tsu.config.json'];

/**
 * Finds the closest config file by walking up the directory tree
 * @param startPath - Starting directory to search from
 * @returns Path to config file or null if not found
 */
function findConfigFile(startPath: string): string | null {
  let currentPath = startPath;

  // Walk up directory tree until we find a config file or reach root
  while (currentPath !== dirname(currentPath)) {
    for (const fileName of CONFIG_FILE_NAMES) {
      const configPath = join(currentPath, fileName);
      if (existsSync(configPath)) {
        return configPath;
      }
    }
    currentPath = dirname(currentPath);
  }

  // Check home directory as fallback
  for (const fileName of CONFIG_FILE_NAMES) {
    const configPath = join(homedir(), fileName);
    if (existsSync(configPath)) {
      return configPath;
    }
  }

  return null;
}

/**
 * Loads and parses a config file
 * @param configPath - Path to the config file
 * @returns Parsed config object
 * @throws Error if file cannot be read or parsed
 */
function loadConfigFromFile(configPath: string): TsuConfig {
  try {
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as TsuConfig;
    return config;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Loads the tsu configuration from the closest config file
 * @param startPath - Starting directory to search from (defaults to current directory)
 * @returns Parsed config object or null if no config file found
 */
export function loadConfig(startPath: string = process.cwd()): TsuConfig | null {
  const configPath = findConfigFile(startPath);
  if (!configPath) {
    return null;
  }

  return loadConfigFromFile(configPath);
}

/**
 * Gets the timeout for a specific command from the config
 * @param config - The config object
 * @param commandPath - Array of command path segments (e.g., ['hook', 'collate'])
 * @param checkName - Optional check name for per-check timeouts (e.g., 'dart-format')
 * @returns Timeout in milliseconds or undefined if not configured
 */
export function getTimeoutFromConfig(
  config: TsuConfig | null,
  commandPath: string[],
  checkName?: string
): number | undefined {
  if (!config) {
    return undefined;
  }

  // Check for per-check timeout first (most specific)
  if (checkName && commandPath[0] === 'hook' && commandPath[1] === 'collate') {
    const checkTimeout =
      config.hook?.collate?.checks?.[checkName as keyof typeof config.hook.collate.checks]?.timeout;
    if (checkTimeout !== undefined) {
      return checkTimeout;
    }
  }

  // Check for command-specific timeout
  if (commandPath[0] === 'hook' && commandPath[1] === 'collate') {
    const collateTimeout = config.hook?.collate?.timeout;
    if (collateTimeout !== undefined) {
      return collateTimeout;
    }
  }

  // Fall back to global timeout
  return config.timeout;
}
