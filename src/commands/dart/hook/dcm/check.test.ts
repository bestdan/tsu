import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookDcmCheck } from './check.js';
import * as gitUtils from '../../../../utils/git.js';
import * as dartUtils from '../../../../utils/dart.js';
import { execSync } from 'node:child_process';

// Mock the execSync function
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('dartHookDcmCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getAllChangedFilesSpy: any;
  let hasUnstagedChangesSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getAllChangedFilesSpy = vi.spyOn(gitUtils, 'getAllChangedFiles');
    hasUnstagedChangesSpy = vi.spyOn(gitUtils, 'hasUnstagedChanges');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getAllChangedFilesSpy.mockRestore();
    hasUnstagedChangesSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit successfully if DCM is not installed', () => {
    // Mock execSync to fail for command -v dcm (DCM not installed)
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        throw new Error('dcm not found');
      }
      return Buffer.from('');
    });

    expect(() => {
      dartHookDcmCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  Warning: DCM not installed, skipping'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if not in a git repository', () => {
    // Mock DCM as installed
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(false);

    expect(() => {
      dartHookDcmCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Not in a git repository'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with error if not in a Dart package', () => {
    // Mock DCM as installed
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(false);

    expect(() => {
      dartHookDcmCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Not in a Dart package'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if no Dart source files modified', () => {
    // Mock DCM as installed
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartHookDcmCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No Dart source files modified'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if only generated files are modified', () => {
    // Mock DCM as installed
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/models/user.g.dart',
      'lib/models/user.freezed.dart',
      'lib/graphql/query.gql.dart',
    ]);

    expect(() => {
      dartHookDcmCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No Dart source files modified'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should run dcm fix and exit with success if no changes created', () => {
    // Mock DCM as installed and working
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('dcm fix')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/user.dart', 'lib/main.dart']);
    hasUnstagedChangesSpy.mockReturnValue(false); // No unstaged changes

    expect(() => {
      dartHookDcmCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ All files pass DCM checks'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if dcm fix creates changes', () => {
    // Mock DCM as installed and creating changes
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('dcm fix')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/user.dart']);
    hasUnstagedChangesSpy.mockReturnValue(true); // Has unstaged changes

    expect(() => {
      dartHookDcmCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Push blocked: DCM fixes were applied. Please stage and commit these changes:'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle multiple files with changes', () => {
    // Mock DCM as installed and creating changes
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('dcm fix')) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/user.dart',
      'lib/main.dart',
      'lib/utils.dart',
    ]);
    hasUnstagedChangesSpy.mockReturnValue(true); // Has unstaged changes

    expect(() => {
      dartHookDcmCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/main.dart');
    expect(consoleErrorSpy).toHaveBeenCalledWith('lib/utils.dart');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with error if dcm fix command fails', () => {
    // Mock DCM as installed but failing
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (typeof cmd === 'string' && cmd.startsWith('dcm fix')) {
        throw new Error('dcm fix failed');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/user.dart']);

    expect(() => {
      dartHookDcmCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Failed to run dcm fix'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('dcm fix failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
