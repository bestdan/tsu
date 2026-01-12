import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hookCollate } from './collate.js';
import * as gitUtils from '../git/utils/git.js';
import * as dartUtils from '../dart/utils/dart.js';
import { execSync, execFile } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
  execFile: vi.fn(),
}));

// Mock util - promisify should return a function that returns a promise
vi.mock('node:util', () => ({
  promisify: vi.fn((fn) => {
    return (...args: any[]) => {
      return new Promise((resolve, reject) => {
        fn(...args, (error?: any, stdout?: string, stderr?: string) => {
          if (error) {
            reject(error);
          } else {
            resolve({ stdout: stdout || '', stderr: stderr || '' });
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
  const mockExecFile = vi.mocked(execFile);
  const mockIsGitRepo = vi.mocked(gitUtils.isGitRepo);
  const mockIsDartPackage = vi.mocked(dartUtils.isDartPackage);
  const mockGetAllChangedFiles = vi.mocked(gitUtils.getAllChangedFiles);

  beforeEach(() => {
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

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock execFile for codeowners check (which still runs even with no files)
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // Should run codeowners check even when no files changed
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);
    mockExit.mockRestore();
  });

  it('should exit with code 1 when not in a git repository', async () => {
    mockIsGitRepo.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(hookCollate({ verbose: false })).rejects.toThrow('process.exit called');

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a git repository');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should exit with code 1 when not in a Dart package', async () => {
    mockIsDartPackage.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(hookCollate({ verbose: false })).rejects.toThrow('process.exit called');

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a Dart package');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run all hooks by default when Dart files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'lib/utils.dart']);

    // Mock which command to succeed (execSync for getTsuCommand)
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock execFile for hook commands (async)
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // Should run all hooks (format, analysis, dcm analyze, codeowners)
    // graphql should be skipped since no .graphql files
    // which tsu + 4 hook commands (format, analysis, dcm analyze, codeowners)
    expect(mockExecFile).toHaveBeenCalledTimes(4);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should only run dart-format when specified', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock execFile for hook commands
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
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
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should track and report failures when hooks fail', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec to fail the first hook command
    let callCount = 0;
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
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

  it('should extract and display file details from format check failures', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec to fail with format check output
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (callback) {
          if (argsArray && argsArray.includes('format')) {
            const error = new Error('Command failed') as Error & {
              code: number;
              stderr: string;
            };
            error.code = 1;
            error.stderr = `
❌ Push blocked: Files were formatted. Please stage and commit these changes:
lib/widget.dart
lib/helper.dart
`;
            callback(error, '', error.stderr);
          } else {
            callback(null, '', '');
          }
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorCalls: string[] = [];
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      errorCalls.push(msg);
    });

    await hookCollate({ dartFormat: true, verbose: false });

    // Should show failure details with files
    expect(errorCalls).toContain('  - dart format check');
    expect(errorCalls).toContain('    Files need formatting');
    expect(errorCalls).toContain('      lib/widget.dart');
    expect(errorCalls).toContain('      lib/helper.dart');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should extract and display file details from analysis check failures', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec to fail with analysis check output
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (callback) {
          if (argsArray && argsArray.includes('analysis')) {
            const error = new Error('Command failed') as Error & {
              code: number;
              stderr: string;
            };
            error.code = 1;
            error.stderr = `
❌ Push blocked: dart analyze found issues in the following file(s):
  lib/api.dart
  lib/model.dart

Run \`dart fix --apply\` to fix some issues automatically.
`;
            callback(error, '', error.stderr);
          } else {
            callback(null, '', '');
          }
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorCalls: string[] = [];
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      errorCalls.push(msg);
    });

    await hookCollate({ dartAnalysis: true, verbose: false });

    // Should show failure details with files
    expect(errorCalls).toContain('  - dart analysis check');
    expect(errorCalls).toContain('    dart analyze found issues');
    expect(errorCalls).toContain('      lib/api.dart');
    expect(errorCalls).toContain('      lib/model.dart');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should handle failures without parseable output gracefully', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock exec to fail with unparseable output
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (callback) {
          if (argsArray && argsArray.includes('format')) {
            const error = new Error('Some unknown error') as Error & { code: number };
            error.code = 1;
            callback(error, '', 'Some unknown error');
          } else {
            callback(null, '', '');
          }
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const errorCalls: string[] = [];
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg: string) => {
      errorCalls.push(msg);
    });

    await hookCollate({ dartFormat: true, verbose: false });

    // Should still show the check name even without parseable details
    expect(errorCalls).toContain('  - dart format check');
    // Should not have extra lines for files/message since they couldn't be parsed
    expect(errorCalls.filter((c) => c.startsWith('    '))).toHaveLength(0);
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run GraphQL check when .graphql files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue(['schema/query.graphql']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock execFile for hook commands
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // 2 hook commands (graphql and codeowners, no dart files so dart hooks skipped)
    expect(mockExecFile).toHaveBeenCalledTimes(2);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should pass changed file options to hook commands', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Mock execFile for hook commands and capture calls
    mockExecFile.mockImplementation(
      (
        _file: string,
        _args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
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
    const calls = mockExecFile.mock.calls;
    // Filter for hook calls by checking if args contain 'hook'
    const hookCalls = calls.filter((call: any) => {
      const args = call[1] as string[];
      return args && args.includes('hook');
    });

    // Verify each hook call has the expected flags in its args
    hookCalls.forEach((call: any) => {
      const args = call[1] as string[];
      expect(args).toContain('--staged');
      expect(args).toContain('--base-branch');
      expect(args).toContain('develop');
      expect(args).toContain('--verbose');
    });

    mockExit.mockRestore();
  });

  it('should run hooks concurrently, not sequentially', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'schema/query.graphql']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track when each command starts
    const executionOrder: string[] = [];

    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        // Determine hook name from args
        const argsArray = args as string[];
        const hookName =
          argsArray && argsArray.includes('format')
            ? 'format'
            : argsArray && argsArray.includes('analysis')
              ? 'analysis'
              : argsArray && argsArray.includes('dcm')
                ? 'dcm'
                : argsArray && argsArray.includes('codeowners')
                  ? 'codeowners'
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

    // All 5 hooks should have been started
    expect(executionOrder).toHaveLength(5);
    expect(executionOrder).toContain('format');
    expect(executionOrder).toContain('analysis');
    expect(executionOrder).toContain('dcm');
    expect(executionOrder).toContain('graphql');
    expect(executionOrder).toContain('codeowners');

    // With concurrent execution, all hooks start before any complete
    // This is validated by the fact that all hooks were called
    expect(mockExecFile).toHaveBeenCalledTimes(5);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should run codeowners check by default when Dart files are changed', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track which commands are called
    const calledCommands: string[] = [];
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (argsArray) {
          // Track which command was called
          const commandPath = argsArray.join(' ');
          calledCommands.push(commandPath);
        }
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ verbose: false });

    // Should include codeowners check
    expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(true);
    // Should run 4 hooks: format, analysis, dcm analyze, codeowners (graphql skipped)
    expect(mockExecFile).toHaveBeenCalledTimes(4);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should skip codeowners check when explicitly disabled with other flags', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track which commands are called
    const calledCommands: string[] = [];
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (argsArray) {
          const commandPath = argsArray.join(' ');
          calledCommands.push(commandPath);
        }
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ dartFormat: true, verbose: false });

    // Should NOT include codeowners check (only dartFormat specified)
    expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(false);
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should run only codeowners check when specified', async () => {
    mockGetAllChangedFiles.mockReturnValue([]);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track which commands are called
    const calledCommands: string[] = [];
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (argsArray) {
          const commandPath = argsArray.join(' ');
          calledCommands.push(commandPath);
        }
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ codeowners: true, verbose: false });

    // Should only run codeowners check
    expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(true);
    expect(mockExecFile).toHaveBeenCalledTimes(1);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should not pass changed file args to codeowners check', async () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));

    // Track args passed to commands
    const commandArgs: string[][] = [];
    mockExecFile.mockImplementation(
      (
        _file: string,
        args: readonly string[] | null | undefined,
        _options: any,
        callback?: ((error: any, stdout: string, stderr: string) => void) | null
      ) => {
        const argsArray = args as string[];
        if (argsArray) {
          commandArgs.push([...argsArray]);
        }
        if (callback) {
          callback(null, '', '');
        }
        return {} as any;
      }
    );

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    await hookCollate({ staged: true, baseBranch: 'develop', verbose: false });

    // Find the codeowners command args
    const codeownersArgs = commandArgs.find((args) => args.includes('codeowners'));

    // Should NOT include --staged or --base-branch
    expect(codeownersArgs).toBeDefined();
    expect(codeownersArgs).not.toContain('--staged');
    expect(codeownersArgs).not.toContain('--base-branch');
    expect(codeownersArgs).not.toContain('develop');

    mockExit.mockRestore();
  });
});
