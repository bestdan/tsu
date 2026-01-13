import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig, getTimeoutFromConfig } from './config.js';
import type { TsuConfig } from '../types/config.js';

describe('config', () => {
  let testDir: string;

  beforeEach(() => {
    // Create a unique temp directory for each test
    testDir = join(tmpdir(), `tsu-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up temp directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('loadConfig', () => {
    it('should return null when no config file exists', () => {
      const config = loadConfig(testDir);
      expect(config).toBeNull();
    });

    it('should load .tsurc file', () => {
      const configData: TsuConfig = { timeout: 5000 };
      writeFileSync(join(testDir, '.tsurc'), JSON.stringify(configData));

      const config = loadConfig(testDir);
      expect(config).toEqual(configData);
    });

    it('should load .tsurc.json file', () => {
      const configData: TsuConfig = { timeout: 10000 };
      writeFileSync(join(testDir, '.tsurc.json'), JSON.stringify(configData));

      const config = loadConfig(testDir);
      expect(config).toEqual(configData);
    });

    it('should load tsu.config.json file', () => {
      const configData: TsuConfig = { timeout: 15000 };
      writeFileSync(join(testDir, 'tsu.config.json'), JSON.stringify(configData));

      const config = loadConfig(testDir);
      expect(config).toEqual(configData);
    });

    it('should prefer .tsurc over other config files', () => {
      const configData1: TsuConfig = { timeout: 5000 };
      const configData2: TsuConfig = { timeout: 10000 };
      writeFileSync(join(testDir, '.tsurc'), JSON.stringify(configData1));
      writeFileSync(join(testDir, 'tsu.config.json'), JSON.stringify(configData2));

      const config = loadConfig(testDir);
      expect(config).toEqual(configData1);
    });

    it('should walk up directory tree to find config', () => {
      const subDir = join(testDir, 'sub', 'nested', 'deep');
      mkdirSync(subDir, { recursive: true });

      const configData: TsuConfig = { timeout: 7000 };
      writeFileSync(join(testDir, '.tsurc'), JSON.stringify(configData));

      const config = loadConfig(subDir);
      expect(config).toEqual(configData);
    });

    it('should load config with hook settings', () => {
      const configData: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            timeout: 20000,
            checks: {
              'dart-format': { timeout: 3000 },
              'dart-analysis': { timeout: 15000 },
            },
          },
        },
      };
      writeFileSync(join(testDir, '.tsurc'), JSON.stringify(configData));

      const config = loadConfig(testDir);
      expect(config).toEqual(configData);
    });

    it('should throw error for invalid JSON', () => {
      writeFileSync(join(testDir, '.tsurc'), 'invalid json {');

      expect(() => loadConfig(testDir)).toThrow('Failed to load config');
    });
  });

  describe('getTimeoutFromConfig', () => {
    it('should return undefined when config is null', () => {
      const timeout = getTimeoutFromConfig(null, ['hook', 'collate']);
      expect(timeout).toBeUndefined();
    });

    it('should return global timeout when no specific timeout is set', () => {
      const config: TsuConfig = { timeout: 5000 };
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate']);
      expect(timeout).toBe(5000);
    });

    it('should return command-specific timeout over global', () => {
      const config: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            timeout: 15000,
          },
        },
      };
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate']);
      expect(timeout).toBe(15000);
    });

    it('should return check-specific timeout over command timeout', () => {
      const config: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            timeout: 15000,
            checks: {
              'dart-format': { timeout: 3000 },
            },
          },
        },
      };
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-format');
      expect(timeout).toBe(3000);
    });

    it('should fall back to command timeout when check-specific is not set', () => {
      const config: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            timeout: 15000,
            checks: {
              'dart-format': { timeout: 3000 },
            },
          },
        },
      };
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'dart-analysis');
      expect(timeout).toBe(15000);
    });

    it('should return undefined when no timeout is configured', () => {
      const config: TsuConfig = {};
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate']);
      expect(timeout).toBeUndefined();
    });

    it('should handle check name that does not exist in config', () => {
      const config: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            checks: {
              'dart-format': { timeout: 3000 },
            },
          },
        },
      };
      const timeout = getTimeoutFromConfig(config, ['hook', 'collate'], 'nonexistent-check');
      expect(timeout).toBe(5000);
    });

    it('should return global timeout for non-collate commands', () => {
      const config: TsuConfig = {
        timeout: 5000,
        hook: {
          collate: {
            timeout: 15000,
          },
        },
      };
      const timeout = getTimeoutFromConfig(config, ['git', 'changed']);
      expect(timeout).toBe(5000);
    });
  });
});
