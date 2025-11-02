import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookGraphqlCheck } from './dart-hook-graphql-check.js';
import * as gitUtils from '../utils/git.js';
import * as dartUtils from '../utils/dart.js';
import { execSync } from 'node:child_process';

// Mock the execSync function
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('dartHookGraphqlCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getAllChangedFilesSpy: any;
  let getGitStatusSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getAllChangedFilesSpy = vi.spyOn(gitUtils, 'getAllChangedFiles');
    getGitStatusSpy = vi.spyOn(gitUtils, 'getGitStatus');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getAllChangedFilesSpy.mockRestore();
    getGitStatusSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with error if not in a git repository', () => {
    isGitRepoSpy.mockReturnValue(false);

    expect(() => {
      dartHookGraphqlCheck({ verbose: false });
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
      dartHookGraphqlCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Not in a Dart package'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if no GraphQL files modified', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/user.dart', 'lib/main.dart']);

    expect(() => {
      dartHookGraphqlCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No GraphQL files modified (skipping)'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit successfully if melos is not installed', () => {
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        throw new Error('melos not found');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/graphql/query.graphql',
      'lib/user.dart',
    ]);

    expect(() => {
      dartHookGraphqlCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  Warning: Melos not installed, skipping'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should run codegen and exit with success if no changes created', () => {
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (
        typeof cmd === 'string' &&
        (cmd.includes('melos run codegen:graphql:test') ||
          cmd === 'melos run codegen:graphql')
      ) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/graphql/query.graphql',
      'lib/user.dart',
    ]);
    const gitStatus = 'M lib/user.dart\n';
    getGitStatusSpy.mockReturnValue(gitStatus); // Same status before and after

    expect(() => {
      dartHookGraphqlCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ GraphQL fakes are up to date'
    );
    // Verify both commands were called
    expect(execSyncMock).toHaveBeenCalledWith(
      'melos run codegen:graphql',
      expect.any(Object)
    );
    expect(execSyncMock).toHaveBeenCalledWith(
      'melos run codegen:graphql:test',
      expect.any(Object)
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if codegen creates changes', () => {
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (
        typeof cmd === 'string' &&
        (cmd.includes('melos run codegen:graphql:test') ||
          cmd === 'melos run codegen:graphql')
      ) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/graphql/query.graphql']);

    // Different status before and after
    getGitStatusSpy
      .mockReturnValueOnce('M  lib/graphql/query.graphql\n')
      .mockReturnValueOnce(
        'M  lib/graphql/query.graphql\n M lib/graphql/query.fakes.dart\n'
      );

    expect(() => {
      dartHookGraphqlCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  WARNING: GraphQL fakes need regeneration!'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('   Modified files:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '   lib/graphql/query.fakes.dart'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with error if codegen command fails', () => {
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (
        typeof cmd === 'string' &&
        (cmd.includes('melos run codegen:graphql:test') ||
          cmd === 'melos run codegen:graphql')
      ) {
        throw new Error('codegen failed');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/graphql/query.graphql']);
    getGitStatusSpy.mockReturnValue('M lib/graphql/query.graphql\n');

    expect(() => {
      dartHookGraphqlCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: Failed to run GraphQL code generation'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('codegen failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show verbose messages when verbose is true', () => {
    const execSyncMock = vi.mocked(execSync);
    execSyncMock.mockImplementation((cmd) => {
      if (typeof cmd === 'string' && cmd.includes('command -v')) {
        return Buffer.from('');
      }
      if (
        typeof cmd === 'string' &&
        (cmd.includes('melos run codegen:graphql:test') ||
          cmd === 'melos run codegen:graphql')
      ) {
        return Buffer.from('');
      }
      return Buffer.from('');
    });

    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/graphql/query.graphql',
      'lib/graphql/mutation.graphql',
    ]);
    const gitStatus = 'M lib/graphql/query.graphql\n';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      dartHookGraphqlCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '🧪 Checking for modified GraphQL files...'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '📝 Found modified GraphQL files: 2'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('  lib/graphql/query.graphql');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '  lib/graphql/mutation.graphql'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '🔧 Running GraphQL code generation...'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ GraphQL fakes are up to date'
    );
  });
});
