import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookFormatCheck } from './check.js';
import * as gitUtils from '../../git/utils/git.js';
import * as dartUtils from '../../dart/utils/dart.js';
import { execSync } from 'node:child_process';
import { resetVerbose } from '../../../utils/verbose-state.js';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('dartHookFormatCheck', () => {
  let consoleErrorSpy: any;
  let consoleLogSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getAllChangedFilesSpy: any;

  beforeEach(() => {
    // Reset verbose state before each test
    resetVerbose();

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getAllChangedFilesSpy = vi.spyOn(gitUtils, 'getAllChangedFiles');

    // Mock execSync to succeed by default
    vi.mocked(execSync).mockReturnValue('' as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getAllChangedFilesSpy.mockRestore();
    // Don't clear all mocks - it interferes with vi.mock() at module level
    // vi.clearAllMocks();
  });

  it('should exit with error if not in a git repository', () => {
    isGitRepoSpy.mockReturnValue(false);

    expect(() => {
      dartHookFormatCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not in a git repository');
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
    getAllChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No Dart source files modified');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if only generated files are modified', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([
      'lib/models/user.g.dart',
      'lib/models/user.freezed.dart',
      'lib/graphql/query.gql.dart',
    ]);

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No Dart source files modified');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should use getAllChangedFiles to get files to check', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(getAllChangedFilesSpy).toHaveBeenCalled();
  });

  it('should display file list in verbose mode when files need formatting', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue(['lib/main.dart']);

    // Mock execSync to throw with status 1 (files need formatting)
    vi.mocked(execSync).mockImplementationOnce(() => {
      const error: any = new Error('Command failed');
      error.status = 1;
      error.stdout = Buffer.from('lib/main.dart');
      throw error;
    });

    expect(() => {
      dartHookFormatCheck({ verbose: true });
    }).toThrow('process.exit(1)');

    // Should display the file list
    expect(consoleErrorSpy).toHaveBeenCalledWith('Checking dart format on 1 file(s):');
    expect(consoleErrorSpy).toHaveBeenCalledWith('  lib/main.dart');

    // Should output exit code for piping
    expect(consoleLogSpy).toHaveBeenCalledWith(1);

    // Should show error message in verbose mode
    expect(consoleErrorSpy).toHaveBeenCalledWith('');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '❌ Files would be reformatted. Please run dart format and commit these changes:'
    );
  });
});
