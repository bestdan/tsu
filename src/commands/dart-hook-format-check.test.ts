import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookFormatCheck } from './dart-hook-format-check.js';
import * as gitUtils from '../utils/git.js';
import * as dartUtils from '../utils/dart.js';
import { execSync } from 'node:child_process';

// Mock the execSync function
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('dartHookFormatCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getChangedFilesSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getChangedFilesSpy = vi.spyOn(gitUtils, 'getChangedFiles');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getChangedFilesSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with error if not in a git repository', () => {
    isGitRepoSpy.mockReturnValue(false);

    expect(() => {
      dartHookFormatCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Not in a git repository'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with error if not in a Dart package', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(false);

    expect(() => {
      dartHookFormatCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not in a Dart package');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if no Dart source files modified', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No Dart source files modified'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if only generated files are modified', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([
      'lib/models/user.g.dart',
      'lib/models/user.freezed.dart',
      'lib/graphql/query.gql.dart',
    ]);

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No Dart source files modified'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should format files and exit with success if no changes needed', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue(['lib/user.dart', 'lib/main.dart']);

    // Mock execSync for dart format
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.startsWith('dart format')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('git diff --quiet')) {
        // No changes - exit 0 (but we check this by not throwing)
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ All files properly formatted'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if formatting creates changes', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue(['lib/user.dart']);

    // Mock execSync
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.startsWith('dart format')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('git diff --quiet')) {
        // Has changes - throw error (exit 1)
        throw new Error('git diff detected changes');
      }
      return Buffer.from('');
    });

    expect(() => {
      dartHookFormatCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Push blocked: Files were formatted. Please stage and commit these changes:'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle multiple files with changes', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([
      'lib/user.dart',
      'lib/main.dart',
      'lib/utils.dart',
    ]);

    // Mock execSync
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.startsWith('dart format')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('git diff --quiet')) {
        // Has changes - throw error (exit 1)
        throw new Error('git diff detected changes');
      }
      return Buffer.from('');
    });

    expect(() => {
      dartHookFormatCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/main.dart');
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/utils.dart');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
