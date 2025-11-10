import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setVerbose, isVerbose, resetVerbose } from './verbose-state.js';
import { logIfVerbose } from './logger.js';
import { displayFileList } from './command-helpers.js';

describe('verbose propagation integration', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    resetVerbose();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('logIfVerbose with global state', () => {
    it('should not log when global verbose is false and no explicit verbose provided', () => {
      setVerbose(false);
      logIfVerbose(undefined, 'Test message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should log when global verbose is true and no explicit verbose provided', () => {
      setVerbose(true);
      logIfVerbose(undefined, 'Test message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test message');
    });

    it('should use explicit verbose when provided, ignoring global state (true override)', () => {
      setVerbose(false);
      logIfVerbose(true, 'Test message');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Test message');
    });

    it('should use explicit verbose when provided, ignoring global state (false override)', () => {
      setVerbose(true);
      logIfVerbose(false, 'Test message');
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('displayFileList with global state', () => {
    it('should not display when global verbose is false and no explicit verbose provided', () => {
      setVerbose(false);
      displayFileList({
        files: ['file1.dart', 'file2.dart'],
        message: 'Processing',
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should display when global verbose is true and no explicit verbose provided', () => {
      setVerbose(true);
      displayFileList({
        files: ['file1.dart', 'file2.dart'],
        message: 'Processing',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Processing 2 file(s):');
      expect(consoleErrorSpy).toHaveBeenCalledWith('  file1.dart');
      expect(consoleErrorSpy).toHaveBeenCalledWith('  file2.dart');
    });

    it('should use explicit verbose when provided, ignoring global state (true override)', () => {
      setVerbose(false);
      displayFileList({
        files: ['file1.dart'],
        verbose: true,
        message: 'Processing',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Processing 1 file(s):');
    });

    it('should use explicit verbose when provided, ignoring global state (false override)', () => {
      setVerbose(true);
      displayFileList({
        files: ['file1.dart'],
        verbose: false,
        message: 'Processing',
      });
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });

  describe('integration scenario: hook command sets verbose globally', () => {
    it('should allow utilities to access verbose state set by command', () => {
      // Simulate a hook command setting verbose state
      setVerbose(true);

      // Simulate downstream utilities using the global verbose state
      logIfVerbose(undefined, 'Starting operation...');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Starting operation...');

      displayFileList({
        files: ['test.dart'],
        message: 'Processing',
      });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Processing 1 file(s):');

      logIfVerbose(undefined, 'Operation complete');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Operation complete');
    });

    it('should not show messages when verbose is not set', () => {
      // Simulate hook command not setting verbose (default false)
      // resetVerbose() was called in beforeEach

      // Simulate downstream utilities using the global verbose state
      logIfVerbose(undefined, 'Starting operation...');
      displayFileList({
        files: ['test.dart'],
        message: 'Processing',
      });
      logIfVerbose(undefined, 'Operation complete');

      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
  });
});
