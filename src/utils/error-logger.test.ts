import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { sanitizeErrorMessage, createErrorContext } from './error-logger.js';
import { homedir } from 'os';

describe('error-logger', () => {
  describe('sanitizeErrorMessage', () => {
    it('should replace home directory with tilde', () => {
      const homeDir = homedir();
      const message = `Error in ${homeDir}/projects/test`;

      const result = sanitizeErrorMessage(message);

      expect(result).toBe('Error in ~/projects/test');
    });

    it('should redact potential secrets', () => {
      const message =
        'API key: TEST_live_1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

      const result = sanitizeErrorMessage(message);

      expect(result).toContain('[REDACTED]');
      expect(result).not.toContain('TEST_live_1234567890');
    });

    it('should not redact normal error messages', () => {
      const message = 'File not found: example.ts';

      const result = sanitizeErrorMessage(message);

      expect(result).toBe('File not found: example.ts');
    });

    it('should preserve short alphanumeric strings', () => {
      const message = 'Error in file abc123.txt';

      const result = sanitizeErrorMessage(message);

      expect(result).toBe('Error in file abc123.txt');
    });

    it('should handle messages with multiple paths', () => {
      const homeDir = homedir();
      const message = `Copy from ${homeDir}/src to ${homeDir}/dest`;

      const result = sanitizeErrorMessage(message);

      expect(result).toBe('Copy from ~/src to ~/dest');
    });
  });

  describe('createErrorContext', () => {
    beforeEach(() => {
      // Mock process.cwd() to return a predictable value
      vi.spyOn(process, 'cwd').mockReturnValue('/test/working/directory');
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('should create context from Error object', () => {
      const error = new Error('Test error');
      const command = 'tsu git changed';

      const context = createErrorContext(error, command);

      expect(context.error).toBe('Test error');
      expect(context.command).toBe('tsu git changed');
      expect(context.version).toBeDefined();
      expect(context.nodeVersion).toBe(process.version);
      expect(context.platform).toBe(process.platform);
      expect(context.timestamp).toBeDefined();
      expect(context.cwd).toBeDefined();
    });

    it('should create context from string', () => {
      const error = 'Test error message';
      const command = 'tsu dart check';

      const context = createErrorContext(error, command);

      expect(context.error).toBe('Test error message');
      expect(context.command).toBe('tsu dart check');
    });

    it('should include stack trace if available', () => {
      const error = new Error('Test error with stack');
      const command = 'tsu hook collate';

      const context = createErrorContext(error, command);

      expect(context.stack).toBeDefined();
      expect(context.stack).toContain('Test error with stack');
    });

    it('should sanitize error message in context', () => {
      const homeDir = homedir();
      const error = new Error(`Error in ${homeDir}/test`);
      const command = 'tsu git root';

      const context = createErrorContext(error, command);

      expect(context.error).toContain('~/test');
      expect(context.error).not.toContain(homeDir);
    });

    it('should sanitize stack trace in context', () => {
      const homeDir = homedir();
      const error = new Error('Test error');
      error.stack = `Error: Test error\n    at Object.<anonymous> (${homeDir}/test/file.ts:10:15)`;
      const command = 'tsu check version';

      const context = createErrorContext(error, command);

      expect(context.stack).toContain('~/test/file.ts');
      expect(context.stack).not.toContain(homeDir);
    });

    it('should replace cwd with tilde', () => {
      const homeDir = homedir();
      vi.spyOn(process, 'cwd').mockReturnValue(`${homeDir}/projects/test`);
      const error = new Error('Test error');
      const command = 'tsu dart changed';

      const context = createErrorContext(error, command);

      expect(context.cwd).toBe('~/projects/test');
    });
  });
});
