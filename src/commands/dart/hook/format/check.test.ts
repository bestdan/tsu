import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookFormatCheck } from './check.js';
import * as gitUtils from '../../../git/utils/git.js';
import * as dartUtils from '../../utils/dart.js';

describe('dartHookFormatCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isDartPackageSpy: any;
  let getAllChangedFilesSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isDartPackageSpy = vi.spyOn(dartUtils, 'isDartPackage');
    getAllChangedFilesSpy = vi.spyOn(gitUtils, 'getAllChangedFiles');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isDartPackageSpy.mockRestore();
    getAllChangedFilesSpy.mockRestore();
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
    getAllChangedFilesSpy.mockReturnValue([
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

});
