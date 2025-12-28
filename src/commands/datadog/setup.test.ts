import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dataDogSetup } from './setup.js';
import * as fs from 'fs';
import * as readline from 'readline';

// Mock filesystem
vi.mock('fs');
vi.mock('readline');

describe('dataDogSetup', () => {
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

  describe('non-interactive mode with all options provided', () => {
    it('should create .env file when it does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({
        apiKey: 'test-api-key',
        site: 'datadoghq.com',
        nodeEnv: 'production',
        verbose: false,
      });

      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.env'),
        expect.stringContaining('DD_API_KEY=test-api-key'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('DD_SITE=datadoghq.com'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('NODE_ENV=production'),
        'utf-8'
      );
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('.env'));
    });

    it('should use .env.example as template when it exists', async () => {
      const mockTemplate = `# DataDog Configuration
DD_API_KEY=your_api_key_here
DD_SITE=datadoghq.com
NODE_ENV=development
`;

      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('.env.example')) {
          return true;
        }
        return false;
      });
      vi.mocked(fs.readFileSync).mockReturnValue(mockTemplate);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({
        apiKey: 'new-api-key',
        site: 'datadoghq.eu',
        nodeEnv: 'staging',
      });

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('.env.example'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('DD_API_KEY=new-api-key'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('DD_SITE=datadoghq.eu'),
        'utf-8'
      );
    });

    it('should handle write errors gracefully', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        throw new Error('Permission denied');
      });

      await expect(
        dataDogSetup({
          apiKey: 'test-key',
          site: 'datadoghq.com',
          nodeEnv: 'production',
        })
      ).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: Failed to write .env file');
      expect(console.error).toHaveBeenCalledWith('Permission denied');
    });
  });

  describe('interactive mode', () => {
    it('should prompt for missing values', async () => {
      const mockQuestion = vi.fn();
      mockQuestion
        .mockImplementationOnce((_q, cb) => cb('test-api-key')) // API key
        .mockImplementationOnce((_q, cb) => cb('')) // Site (empty = use default)
        .mockImplementationOnce((_q, cb) => cb('production')); // NODE_ENV

      const mockClose = vi.fn();

      vi.mocked(readline.createInterface).mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      } as any);

      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({ verbose: true });

      expect(mockQuestion).toHaveBeenCalledTimes(3);
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('DD_API_KEY=test-api-key'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('DD_SITE=datadoghq.com'),
        'utf-8'
      );
      expect(fs.writeFileSync).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining('NODE_ENV=production'),
        'utf-8'
      );
    });

    it('should exit if API key is not provided', async () => {
      const mockQuestion = vi.fn();
      mockQuestion.mockImplementationOnce((_q, cb) => cb('')); // Empty API key

      const mockClose = vi.fn();

      vi.mocked(readline.createInterface).mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      } as any);

      vi.mocked(fs.existsSync).mockReturnValue(false);

      await expect(dataDogSetup({})).rejects.toThrow('process.exit: 1');

      expect(console.error).toHaveBeenCalledWith('Error: API key is required');
    });

    it('should cancel setup if user declines to overwrite existing .env', async () => {
      const mockQuestion = vi.fn();
      mockQuestion.mockImplementationOnce((_q, cb) => cb('n')); // Don't overwrite

      const mockClose = vi.fn();

      vi.mocked(readline.createInterface).mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      } as any);

      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('.env')) {
          return true;
        }
        return false;
      });

      await expect(dataDogSetup({})).rejects.toThrow('process.exit: 0');

      expect(console.error).toHaveBeenCalledWith(
        'Setup cancelled. Edit your .env file manually if needed.'
      );
    });

    it('should proceed if user confirms to overwrite existing .env', async () => {
      const mockQuestion = vi.fn();
      mockQuestion
        .mockImplementationOnce((_q, cb) => cb('y')) // Overwrite confirmation
        .mockImplementationOnce((_q, cb) => cb('test-key')) // API key
        .mockImplementationOnce((_q, cb) => cb('datadoghq.eu')) // Site
        .mockImplementationOnce((_q, cb) => cb('staging')); // NODE_ENV

      const mockClose = vi.fn();

      vi.mocked(readline.createInterface).mockReturnValue({
        question: mockQuestion,
        close: mockClose,
      } as any);

      vi.mocked(fs.existsSync).mockImplementation((path) => {
        if (typeof path === 'string' && path.endsWith('.env')) {
          return true;
        }
        return false;
      });
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({});

      expect(fs.writeFileSync).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('DataDog configuration complete!')
      );
    });
  });

  describe('verbose output', () => {
    it('should show verbose messages when verbose is true', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({
        apiKey: 'test-key',
        site: 'datadoghq.com',
        nodeEnv: 'dev',
        verbose: true,
      });

      expect(console.error).toHaveBeenCalledWith('Setting up DataDog configuration...');
      expect(console.error).toHaveBeenCalledWith('Creating .env from scratch');
      expect(console.error).toHaveBeenCalledWith('.env file created successfully');
    });

    it('should not show verbose messages when verbose is false', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      await dataDogSetup({
        apiKey: 'test-key',
        site: 'datadoghq.com',
        nodeEnv: 'dev',
        verbose: false,
      });

      expect(console.error).not.toHaveBeenCalledWith('Setting up DataDog configuration...');
      expect(console.error).not.toHaveBeenCalledWith('Creating .env from scratch');
    });
  });
});
