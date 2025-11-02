import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureCondition } from './command-helpers.js';

describe('ensureCondition', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe('basic behavior', () => {
    it('should do nothing when condition is true', () => {
      expect(() => {
        ensureCondition(true, 'Error message');
      }).not.toThrow();

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should exit with code 1 and log error when condition is false', () => {
      expect(() => {
        ensureCondition(false, 'Error: Something went wrong');
      }).toThrow('process.exit(1)');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error: Something went wrong'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should not log error when condition is false and errorMessage is empty', () => {
      expect(() => {
        ensureCondition(false, '');
      }).toThrow('process.exit(1)');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('verbose mode', () => {
    it('should log success message when condition is true and verbose is true', () => {
      ensureCondition(true, 'Error message', {
        verbose: true,
        successMessage: '✓ Success!',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('✓ Success!');
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not log success message when condition is true but verbose is false', () => {
      ensureCondition(true, 'Error message', {
        verbose: false,
        successMessage: '✓ Success!',
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    it('should not log success message when verbose is true but successMessage is not provided', () => {
      ensureCondition(true, 'Error message', {
        verbose: true,
      });

      expect(consoleErrorSpy).not.toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });

  describe('custom exit codes', () => {
    it('should use custom exit code when provided', () => {
      expect(() => {
        ensureCondition(false, 'Warning message', { exitCode: 0 });
      }).toThrow('process.exit(0)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Warning message');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should use exit code 2 when specified', () => {
      expect(() => {
        ensureCondition(false, 'Custom error', { exitCode: 2 });
      }).toThrow('process.exit(2)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('Custom error');
      expect(processExitSpy).toHaveBeenCalledWith(2);
    });

    it('should default to exit code 1 when not specified', () => {
      expect(() => {
        ensureCondition(false, 'Error');
      }).toThrow('process.exit(1)');

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe('combined options', () => {
    it('should handle verbose and custom exit code together', () => {
      expect(() => {
        ensureCondition(false, '⚠️  Warning', {
          exitCode: 0,
          verbose: true,
          successMessage: '✓ All good',
        });
      }).toThrow('process.exit(0)');

      expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning');
      expect(consoleErrorSpy).not.toHaveBeenCalledWith('✓ All good');
      expect(processExitSpy).toHaveBeenCalledWith(0);
    });

    it('should log success message with custom exit code when condition is true', () => {
      ensureCondition(true, 'Error', {
        exitCode: 0,
        verbose: true,
        successMessage: '✓ Success',
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('✓ Success');
      expect(processExitSpy).not.toHaveBeenCalled();
    });
  });
});
