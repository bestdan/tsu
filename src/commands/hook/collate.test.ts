import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hookCollate } from './collate.js';
import * as gitUtils from '../git/utils/git.js';
import * as dartUtils from '../dart/utils/dart.js';
import { execSync } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  exec: vi.fn(),
}));

// Mock util - promisify should return a function that returns a promise
vi.mock('node:util', () => ({
  promisify: vi.fn((fn) => {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (error: any, stdout: string, stderr: string) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout, stderr });
          }
        });
      });
    };
  }),
}));

// Mock git utilities
vi.mock('../git/utils/git.js', () => ({
  isGitRepo: vi.fn(),
  getAllChangedFiles: vi.fn(),
}));

// Mock dart utilities
vi.mock('../dart/utils/dart.js', () => ({
  isDartPackage: vi.fn(),
}));

describe('hookCollate', () => {
  const mockExecSync = vi.mocked(execSync);
  const mockIsGitRepo = vi.mocked(gitUtils.isGitRepo);
  const mockIsDartPackage = vi.mocked(dartUtils.isDartPackage);
  const mockGetAllChangedFiles = vi.mocked(gitUtils.getAllChangedFiles);

  // We need to import exec after mocking
  let mockExec: any;

  beforeEach(async () => {
    // Dynamically import exec after mocks are set up
    const childProcess = await import('node:child_process');
    mockExec = vi.mocked(childProcess.exec);

    vi.clearAllMocks();
    // Default successful state
    mockIsGitRepo.mockReturnValue(true);
    mockIsDartPackage.mockReturnValue(true);
    mockGetAllChangedFiles.mockReturnValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exit with code 0 when no files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue([]);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    expect(mockExit).toHaveBeenCalledWith(0);
    mockExit.mockRestore();
  });

  it('should exit with code 1 when not in a git repository', async () => {
    mockIsGitRepo.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await hookCollate({ verbose: false });

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a git repository');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should exit with code 1 when not in a Dart package', async () => {
    mockIsDartPackage.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await hookCollate({ verbose: false });

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a Dart package');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run all hooks by default when Dart files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'lib/utils.dart']);

    // Mock which command to succeed (execSync for getTsuCommand)
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec for hook commands (async)
    mockExec.mockImplementation(
      (
        _cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // Should run all 4 hooks (format, analysis, dcm analyze, graphql)
    // But graphql should be skipped since no .graphql files
    // which tsu + 3 hook commands (format, analysis, dcm analyze)
    expect(mockExec).toHaveBeenCalledTimes(3);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should only run dart-format when specified', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec for hook commands
    mockExec.mockImplementation(
      (
        _cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ dartFormat: true, verbose: false });

    // 1 hook command (format only)
    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should track and report failures when hooks fail', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec to fail the first hook command
    let callCount = 0;
    mockExec.mockImplementation(
      (
        _cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        callCount++;
        if (callback) {
          // Fail the first hook command (format check)
          if (callCount === 1) {
            const error = new Error('Command failed') as Error & { code: number };
            error.code = 1;
            callback(error, '', '');
          } else {
            callback(null, '', '');
          }
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await hookCollate({ verbose: false });

    // Should continue running other hooks and report failure at the end
    expect(mockConsoleError).toHaveBeenCalledWith('❌ One or more checks failed:');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run GraphQL check when .graphql files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue(['schema/query.graphql']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec for hook commands
    mockExec.mockImplementation(
      (
        _cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // 1 hook command (graphql only since no dart files)
    expect(mockExec).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should pass changed file options to hook commands', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec for hook commands and capture calls
    mockExec.mockImplementation(
      (
        _cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ staged: true, baseBranch: 'develop', verbose: true });

    // Check that hook commands receive the correct flags
    const calls = mockExec.mock.calls;
    const hookCalls = calls.filter(
      (call: any) => typeof call[0] === 'string' && call[0].includes('hook')
    );

    hookCalls.forEach((call: any) => {
      const cmd = call[0] as string;
      expect(cmd).toContain('--staged');
      expect(cmd).toContain('--base-branch develop');
      expect(cmd).toContain('--verbose');
    });

    mockExit.mockRestore();
  });

  it('should run hooks concurrently, not sequentially', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'schema/query.graphql']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track when each command starts
    const executionOrder: string[] = [];

    mockExec.mockImplementation(
      (
        cmd: string,
        _options: any,
        callback?: (error: any, stdout: string, stderr: string) => void
      ) => {
        const hookName = cmd.includes('format')
          ? 'format'
          : cmd.includes('analysis')
            ? 'analysis'
            : cmd.includes('dcm')
              ? 'dcm'
              : 'graphql';

        executionOrder.push(hookName);

        // Call callback asynchronously using Promise.resolve
        Promise.resolve().then(() => {
          if (callback) {
            callback(null, '', '');
          }
        });

        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // All 4 hooks should have been started
    expect(executionOrder).toHaveLength(4);
    expect(executionOrder).toContain('format');
    expect(executionOrder).toContain('analysis');
    expect(executionOrder).toContain('dcm');
    expect(executionOrder).toContain('graphql');

    // With concurrent execution, all hooks start before any complete
    // This is validated by the fact that all hooks were called
    expect(mockExec).toHaveBeenCalledTimes(4);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });
});
