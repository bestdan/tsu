import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hookCollate } from './collate.js';
import * as gitUtils from '../git/utils/git.js';
import * as dartUtils from '../dart/utils/dart.js';
import { execSync } from 'node:child_process';

// Mock child_process
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
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

  it('should exit with code 0 when no files are changed', () => {
    mockGetAllChangedFiles.mockReturnValue([]);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    hookCollate({ verbose: false });

    expect(mockExit).toHaveBeenCalledWith(0);
    mockExit.mockRestore();
  });

  it('should exit with code 1 when not in a git repository', () => {
    mockIsGitRepo.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    hookCollate({ verbose: false });

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a git repository');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should exit with code 1 when not in a Dart package', () => {
    mockIsDartPackage.mockReturnValue(false);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    hookCollate({ verbose: false });

    expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a Dart package');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run all hooks by default when Dart files are changed', () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'lib/utils.dart']);
    mockExecSync.mockReturnValue(Buffer.from(''));

    // Mock which command to succeed
    mockExecSync.mockImplementation((cmd: string) => {
      if (typeof cmd === 'string' && cmd.includes('which tsu')) {
        return Buffer.from('/usr/bin/tsu');
      }
      return Buffer.from('');
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    hookCollate({ verbose: false });

    // Should run all 4 hooks (format, analysis, dcm analyze, graphql)
    // But graphql should be skipped since no .graphql files
    // which tsu + 3 hook commands (format, analysis, dcm analyze)
    expect(mockExecSync).toHaveBeenCalledTimes(4);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should only run dart-format when specified', () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
    mockExecSync.mockReturnValue(Buffer.from(''));

    // Mock which command to succeed
    mockExecSync.mockImplementation((cmd: string) => {
      if (typeof cmd === 'string' && cmd.includes('which tsu')) {
        return Buffer.from('/usr/bin/tsu');
      }
      return Buffer.from('');
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    hookCollate({ dartFormat: true, verbose: false });

    // which tsu + 1 hook command (format only)
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should track and report failures when hooks fail', () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);

    // Mock which command to succeed
    let callCount = 0;
    mockExecSync.mockImplementation((cmd: string) => {
      callCount++;
      if (typeof cmd === 'string' && cmd.includes('which tsu')) {
        return Buffer.from('/usr/bin/tsu');
      }
      // Fail the first hook command (format check)
      if (callCount === 2) {
        const error = new Error('Command failed') as Error & { status: number };
        error.status = 1;
        throw error;
      }
      return Buffer.from('');
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    hookCollate({ verbose: false });

    // Should continue running other hooks and report failure at the end
    expect(mockConsoleError).toHaveBeenCalledWith('❌ One or more checks failed:');
    expect(mockExit).toHaveBeenCalledWith(1);

    mockExit.mockRestore();
    mockConsoleError.mockRestore();
  });

  it('should run GraphQL check when .graphql files are changed', () => {
    mockGetAllChangedFiles.mockReturnValue(['schema/query.graphql']);
    mockExecSync.mockReturnValue(Buffer.from(''));

    // Mock which command to succeed
    mockExecSync.mockImplementation((cmd: string) => {
      if (typeof cmd === 'string' && cmd.includes('which tsu')) {
        return Buffer.from('/usr/bin/tsu');
      }
      return Buffer.from('');
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    hookCollate({ verbose: false });

    // which tsu + 1 hook command (graphql only since no dart files)
    expect(mockExecSync).toHaveBeenCalledTimes(2);
    expect(mockExit).toHaveBeenCalledWith(0);

    mockExit.mockRestore();
  });

  it('should pass changed file options to hook commands', () => {
    mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
    mockExecSync.mockReturnValue(Buffer.from(''));

    // Mock which command to succeed
    mockExecSync.mockImplementation((cmd: string) => {
      if (typeof cmd === 'string' && cmd.includes('which tsu')) {
        return Buffer.from('/usr/bin/tsu');
      }
      return Buffer.from('');
    });

    const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as never);

    hookCollate({ staged: true, baseBranch: 'develop', verbose: true });

    // Check that hook commands receive the correct flags
    const calls = mockExecSync.mock.calls;
    const hookCalls = calls.filter(
      (call) => typeof call[0] === 'string' && call[0].includes('hook')
    );

    hookCalls.forEach((call) => {
      const cmd = call[0] as string;
      expect(cmd).toContain('--staged');
      expect(cmd).toContain('--base-branch develop');
      expect(cmd).toContain('--verbose');
    });

    mockExit.mockRestore();
  });
});
