import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookDcmCheck } from './check.js';
import * as gitUtils from '../../../../git/utils/git.js';
import * as dartUtils from '../../../utils/dart.js';
import * as shellUtils from '../../../../../utils/shell.js';

describe('dartHookDcmCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getAllChangedFilesSpy: any;
  let isCommandInstalledSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getAllChangedFilesSpy = vi.spyOn(gitUtils, 'getAllChangedFiles');
    isCommandInstalledSpy = vi.spyOn(shellUtils, 'isCommandInstalled');
    
    // Default: DCM is installed
    isCommandInstalledSpy.mockReturnValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getAllChangedFilesSpy.mockRestore();
    isCommandInstalledSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with error if not in a git repository', () => {
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

  it('should use provided files when files option is given', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);

    const providedFiles = ['lib/user.ts', 'lib/main.js'];

    expect(() => {
      dartHookDcmCheck({ verbose: true, files: providedFiles });
    }).toThrow('process.exit(0)');

    expect(getAllChangedFilesSpy).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Using provided files');
  });

  it('should use getAllChangedFiles when no files option is given', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);
    getAllChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartHookDcmCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(getAllChangedFilesSpy).toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Checking all changed files');
  });

  it('should filter provided files to only dart files', () => {
    isGitRepoSpy.mockReturnValue(true);
    isDartPackageSpy.mockReturnValue(true);

    const providedFiles = ['lib/user.ts', 'lib/main.js', 'README.md'];

    expect(() => {
      dartHookDcmCheck({ verbose: true, files: providedFiles });
    }).toThrow('process.exit(0)');

    expect(getAllChangedFilesSpy).not.toHaveBeenCalled();
  });
});
