import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pipeSeries, pipeSeriesFromArgs } from './series.js';

describe('pipeSeries', () => {
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

  describe('all checks passing', () => {
    it('should run all checks and exit 0 when all pass', () => {
      expect(() => {
        pipeSeries([
          { command: 'exit 0', label: 'check1' },
          { command: 'exit 0', label: 'check2' },
          { command: 'exit 0', label: 'check3' },
        ]);
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith('✅ check1 passed');
      expect(mockLog).toHaveBeenCalledWith('✅ check2 passed');
      expect(mockLog).toHaveBeenCalledWith('✅ check3 passed');
      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });

  describe('some checks failing', () => {
    it('should run all checks even if some fail and exit 1', () => {
      expect(() => {
        pipeSeries([
          { command: 'exit 0', label: 'check1' },
          { command: 'exit 1', label: 'check2' },
          { command: 'exit 0', label: 'check3' },
        ]);
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith('✅ check1 passed');
      expect(mockLog).toHaveBeenCalledWith('❌ check2 failed');
      expect(mockLog).toHaveBeenCalledWith('✅ check3 passed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should continue after first failure', () => {
      expect(() => {
        pipeSeries([
          { command: 'exit 1', label: 'fail-first' },
          { command: 'exit 0', label: 'pass-second' },
        ]);
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith('❌ fail-first failed');
      expect(mockLog).toHaveBeenCalledWith('✅ pass-second passed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should exit 1 if multiple checks fail', () => {
      expect(() => {
        pipeSeries([
          { command: 'exit 1', label: 'check1' },
          { command: 'exit 1', label: 'check2' },
        ]);
      }).toThrow('process.exit called');

      expect(mockLog).toHaveBeenCalledWith('❌ check1 failed');
      expect(mockLog).toHaveBeenCalledWith('❌ check2 failed');
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('verbose mode', () => {
    it('should show commands being run in verbose mode', () => {
      expect(() => {
        pipeSeries(
          [
            { command: 'exit 0', label: 'check1' },
            { command: 'exit 0', label: 'check2' },
          ],
          { verbose: true }
        );
      }).toThrow('process.exit called');

      expect(mockError).toHaveBeenCalledWith('\nRunning: exit 0');
      expect(mockError).toHaveBeenCalledWith('\n✅ All checks passed');
    });

    it('should show failure summary in verbose mode', () => {
      expect(() => {
        pipeSeries(
          [
            { command: 'exit 0', label: 'check1' },
            { command: 'exit 1', label: 'check2' },
          ],
          { verbose: true }
        );
      }).toThrow('process.exit called');

      expect(mockError).toHaveBeenCalledWith('\n❌ Some checks failed');
    });
  });

  describe('empty checks', () => {
    it('should exit 0 with no checks', () => {
      expect(() => {
        pipeSeries([]);
      }).toThrow('process.exit called');

      expect(mockExit).toHaveBeenCalledWith(0);
    });
  });
});

describe('pipeSeriesFromArgs', () => {
  let mockExit: any;
  let mockError: any;

  beforeEach(() => {
    mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('valid arguments', () => {
    it('should parse pairs of command and label', () => {
      const result = pipeSeriesFromArgs(['cmd1', 'label1', 'cmd2', 'label2']);

      expect(result).toEqual([
        { command: 'cmd1', label: 'label1' },
        { command: 'cmd2', label: 'label2' },
      ]);
    });

    it('should handle empty array', () => {
      const result = pipeSeriesFromArgs([]);
      expect(result).toEqual([]);
    });

    it('should handle single pair', () => {
      const result = pipeSeriesFromArgs(['exit 0', 'test']);
      expect(result).toEqual([{ command: 'exit 0', label: 'test' }]);
    });
  });

  describe('invalid arguments', () => {
    it('should error on odd number of arguments', () => {
      expect(() => {
        pipeSeriesFromArgs(['cmd1', 'label1', 'cmd2']);
      }).toThrow('process.exit called');

      expect(mockError).toHaveBeenCalledWith(
        'Error: Arguments must be pairs of [command, label]'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });

    it('should error with single argument', () => {
      expect(() => {
        pipeSeriesFromArgs(['cmd1']);
      }).toThrow('process.exit called');

      expect(mockError).toHaveBeenCalledWith(
        'Error: Arguments must be pairs of [command, label]'
      );
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });
});
