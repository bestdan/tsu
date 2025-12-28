import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataDogCheck } from './check.js';
import * as datadog from '../../utils/datadog.js';

// Mock datadog utilities
vi.mock('../../utils/datadog.js');

describe('dataDogCheck', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
      throw new Error(`process.exit: ${code}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('configuration validation', () => {
    it('should exit if DataDog is not configured', async () => {
      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: false,
        site: 'datadoghq.com',
        apiKey: undefined,
      });

      await expect(dataDogCheck({ verbose: false })).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: DataDog is not configured');
      expect(console.error).toHaveBeenCalledWith('DD_API_KEY environment variable is not set');
      expect(console.error).toHaveBeenCalledWith('\nRun "tsu datadog setup" to configure DataDog');
    });

    it('should exit if DataDog client initialization fails', async () => {
      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(null);

      await expect(dataDogCheck({ verbose: false })).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: Failed to initialize DataDog client');
    });
  });

  describe('successful connection check', () => {
    it('should send test log and report success', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockResolvedValue(undefined);

      await dataDogCheck({ verbose: false });

      expect(datadog.sendLogToDataDog).toHaveBeenCalledWith(
        mockLogsApi,
        'DataDog connection test from tsutils',
        datadog.DataDogLogLevel.INFO,
        expect.objectContaining({
          test: true,
          command: 'datadog check',
        })
      );

      expect(console.log).toHaveBeenCalledWith('success');
      expect(console.error).toHaveBeenCalledWith('\n✅ DataDog connection successful!');
      expect(console.error).toHaveBeenCalledWith('Test log has been sent to DataDog.');
      expect(console.error).toHaveBeenCalledWith(
        'Check your logs at: https://app.datadoghq.com/logs'
      );
    });

    it('should show correct URL for different DataDog sites', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.eu',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockResolvedValue(undefined);

      await dataDogCheck({ verbose: false });

      expect(console.error).toHaveBeenCalledWith(
        'Check your logs at: https://app.datadoghq.eu/logs'
      );
    });
  });

  describe('connection failure', () => {
    it('should handle send log errors gracefully', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockRejectedValue(new Error('Network error'));

      await expect(dataDogCheck({ verbose: false })).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: Failed to send test log to DataDog');
      expect(console.error).toHaveBeenCalledWith('Network error');
      expect(console.error).toHaveBeenCalledWith('\nPossible issues:');
      expect(console.error).toHaveBeenCalledWith('- Invalid API key');
      expect(console.error).toHaveBeenCalledWith('- Incorrect DataDog site');
      expect(console.error).toHaveBeenCalledWith('- Network connectivity issues');
    });

    it('should handle non-Error exceptions', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockRejectedValue('String error');

      await expect(dataDogCheck({ verbose: false })).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: Failed to send test log to DataDog');
    });
  });

  describe('verbose output', () => {
    it('should show verbose messages when verbose is true', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockResolvedValue(undefined);

      await dataDogCheck({ verbose: true });

      expect(console.error).toHaveBeenCalledWith('Checking DataDog configuration...');
      expect(console.error).toHaveBeenCalledWith('DataDog site: datadoghq.com');
      expect(console.error).toHaveBeenCalledWith('Sending test log to DataDog...');
      expect(console.error).toHaveBeenCalledWith('Test log sent successfully');
    });

    it('should not show verbose messages when verbose is false', async () => {
      const mockLogsApi = { submitLog: vi.fn() } as any;

      vi.mocked(datadog.loadDataDogConfig).mockReturnValue({
        enabled: true,
        site: 'datadoghq.com',
        apiKey: 'test-key',
      });
      vi.mocked(datadog.initializeDataDogClient).mockReturnValue(mockLogsApi);
      vi.mocked(datadog.sendLogToDataDog).mockResolvedValue(undefined);

      await dataDogCheck({ verbose: false });

      expect(console.error).not.toHaveBeenCalledWith('Checking DataDog configuration...');
      expect(console.error).not.toHaveBeenCalledWith('DataDog site: datadoghq.com');
      expect(console.error).not.toHaveBeenCalledWith('Sending test log to DataDog...');
      expect(console.error).not.toHaveBeenCalledWith('Test log sent successfully');
    });
  });
});
