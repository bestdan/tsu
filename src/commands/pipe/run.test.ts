import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pipeRun } from './run.js';

describe('pipeRun', () => {
  let mockExit: any;
  let mockLog: any;
  let mockError: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('successful commands', () => {
    it('should output exit code 0 and exit 0 for passing command', () => {
      expect(() => {
        pipeRun('exit 0');
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith(0);
      expect(mockExit).toHaveBeenCalledWith(0);
    });

    it('should handle commands with output', () => {
      expect(() => {
        pipeRun('echo "hello"');
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith(0);
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe('failing commands', () => {
    it('should output exit code 1 and exit 1 for failing command', () => {
      expect(() => {
        pipeRun('exit 1');
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith(1);
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should output exit code for specific exit codes', () => {
      expect(() => {
        pipeRun('exit 42');
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith(42);
      expect(mockExit).toHaveBeenCalledWith(42);
    });
  });

  describe('verbose mode', () => {
    it('should show command being run in verbose mode', () => {
      expect(() => {
        pipeRun('exit 0', { verbose: true });
      }).toThrow('process.exit called');

      expect(mockError).toHaveBeenCalledWith('Running: exit 0');
      expect(mockLog).toHaveBeenCalledWith(0);
    });
  });
});
