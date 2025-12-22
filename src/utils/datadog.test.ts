import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  loadDataDogConfig,
  initializeDataDogClient,
  DataDogLogLevel,
  sendLogToDataDog,
  createDataDogLogger,
} from './datadog.js';

describe('datadog', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment before each test
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('loadDataDogConfig', () => {
    it('should load config when DD_API_KEY is set', () => {
      process.env.DD_API_KEY = 'test-api-key';
      process.env.DD_SITE = 'datadoghq.eu';

      const config = loadDataDogConfig();

      expect(config.apiKey).toBe('test-api-key');
      expect(config.site).toBe('datadoghq.eu');
      expect(config.enabled).toBe(true);
    });

    it('should use default site when DD_SITE is not set', () => {
      process.env.DD_API_KEY = 'test-api-key';
      delete process.env.DD_SITE;

      const config = loadDataDogConfig();

      expect(config.site).toBe('datadoghq.com');
    });

    it('should return disabled config when DD_API_KEY is not set', () => {
      delete process.env.DD_API_KEY;

      const config = loadDataDogConfig();

      expect(config.apiKey).toBeUndefined();
      expect(config.enabled).toBe(false);
    });

    it('should return disabled config when DD_API_KEY is empty', () => {
      process.env.DD_API_KEY = '';

      const config = loadDataDogConfig();

      expect(config.apiKey).toBe('');
      expect(config.enabled).toBe(false);
    });
  });

  describe('initializeDataDogClient', () => {
    it('should return null when config is disabled', () => {
      const config = {
        apiKey: undefined,
        site: 'datadoghq.com',
        enabled: false,
      };

      const client = initializeDataDogClient(config);

      expect(client).toBeNull();
    });

    it('should return null when apiKey is missing', () => {
      const config = {
        apiKey: undefined,
        site: 'datadoghq.com',
        enabled: true,
      };

      const client = initializeDataDogClient(config);

      expect(client).toBeNull();
    });

    it('should return client when config is valid', () => {
      const config = {
        apiKey: 'test-api-key',
        site: 'datadoghq.com',
        enabled: true,
      };

      const client = initializeDataDogClient(config);

      expect(client).not.toBeNull();
    });

    it('should use custom site in configuration', () => {
      const config = {
        apiKey: 'test-api-key',
        site: 'datadoghq.eu',
        enabled: true,
      };

      const client = initializeDataDogClient(config);

      expect(client).not.toBeNull();
    });
  });

  describe('sendLogToDataDog', () => {
    it('should return early when logsApi is null', async () => {
      await expect(
        sendLogToDataDog(null, 'test message', DataDogLogLevel.INFO)
      ).resolves.toBeUndefined();
    });

    it('should handle metadata parameter', async () => {
      const metadata = { userId: '123', action: 'test' };
      await expect(
        sendLogToDataDog(null, 'test message', DataDogLogLevel.INFO, metadata)
      ).resolves.toBeUndefined();
    });

    it('should default to INFO level when level not specified', async () => {
      await expect(sendLogToDataDog(null, 'test message')).resolves.toBeUndefined();
    });
  });

  describe('createDataDogLogger', () => {
    it('should create logger with info method', async () => {
      const logger = createDataDogLogger(null);

      await expect(logger.info('test message')).resolves.toBeUndefined();
    });

    it('should create logger with warn method', async () => {
      const logger = createDataDogLogger(null);

      await expect(logger.warn('test warning')).resolves.toBeUndefined();
    });

    it('should create logger with error method', async () => {
      const logger = createDataDogLogger(null);

      await expect(logger.error('test error')).resolves.toBeUndefined();
    });

    it('should handle metadata in info logs', async () => {
      const logger = createDataDogLogger(null);
      const metadata = { key: 'value' };

      await expect(logger.info('test message', metadata)).resolves.toBeUndefined();
    });

    it('should handle metadata in warn logs', async () => {
      const logger = createDataDogLogger(null);
      const metadata = { key: 'value' };

      await expect(logger.warn('test warning', metadata)).resolves.toBeUndefined();
    });

    it('should handle metadata in error logs', async () => {
      const logger = createDataDogLogger(null);
      const metadata = { key: 'value' };

      await expect(logger.error('test error', metadata)).resolves.toBeUndefined();
    });
  });

  describe('DataDogLogLevel', () => {
    it('should have INFO level', () => {
      expect(DataDogLogLevel.INFO).toBe('info');
    });

    it('should have WARN level', () => {
      expect(DataDogLogLevel.WARN).toBe('warn');
    });

    it('should have ERROR level', () => {
      expect(DataDogLogLevel.ERROR).toBe('error');
    });
  });
});
