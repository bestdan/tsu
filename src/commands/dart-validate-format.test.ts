import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartValidateFormat } from './dart-validate-format.js';
import * as gitUtils from '../utils/git.js';
import * as dartUtils from '../utils/dart.js';
import * as shellUtils from '../utils/shell.js';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

// Mock the modules
vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

vi.mock('node:fs', () => ({
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
}));

describe('dartValidateFormat', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isCommandInstalledSpy: any;
  let getChangedFilesSpy: any;
  let findAffectedPackagesSpy: any;
  let existsSyncSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isCommandInstalledSpy = vi.spyOn(shellUtils, 'isCommandInstalled');
    getChangedFilesSpy = vi.spyOn(gitUtils, 'getChangedFiles');
    findAffectedPackagesSpy = vi.spyOn(dartUtils, 'findAffectedPackages');
    existsSyncSpy = vi.mocked(existsSync);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isCommandInstalledSpy.mockRestore();
    getChangedFilesSpy.mockRestore();
    findAffectedPackagesSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with error if dart is not installed', () => {
    isCommandInstalledSpy.mockReturnValue(false);

    expect(() => {
      dartValidateFormat({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: dart command not found. Please install Dart SDK.'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if no staged Dart files to validate', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([]);

    expect(() => {
      dartValidateFormat({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No staged Dart files to validate'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should validate packages when PACKAGE_INDEX exists', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([
      'packages/app/lib/main.dart',
      'packages/core/lib/utils.dart',
    ]);
    findAffectedPackagesSpy.mockReturnValue(
      new Map([
        ['packages/app', 'app'],
        ['packages/core', 'core'],
      ])
    );
    existsSyncSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue(Buffer.from(''));

    expect(() => {
      dartValidateFormat({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      'dart format --set-exit-if-changed .',
      expect.objectContaining({ cwd: expect.stringContaining('packages/app') })
    );
    expect(execSync).toHaveBeenCalledWith(
      'dart format --set-exit-if-changed .',
      expect.objectContaining({ cwd: expect.stringContaining('packages/core') })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should validate specific files when provided', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([]); // No staged files
    findAffectedPackagesSpy.mockReturnValue(new Map());
    existsSyncSpy.mockReturnValue(true);

    // Make execSync succeed without throwing
    vi.mocked(execSync).mockImplementationOnce(() => {
      // Simulate successful format
      return Buffer.from('');
    });

    expect(() => {
      dartValidateFormat({
        verbose: true,
        files: ['lib/main.dart', 'lib/utils.dart'],
      });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringContaining('dart format --set-exit-if-changed'),
      expect.anything()
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if formatting check fails', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
    findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
    existsSyncSpy.mockReturnValue(true);
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('Formatting check failed');
    });

    expect(() => {
      dartValidateFormat({ verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ app formatting failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should filter out generated files', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    getChangedFilesSpy.mockReturnValue([]); // No staged files
    findAffectedPackagesSpy.mockReturnValue(new Map());
    existsSyncSpy.mockReturnValue(true);

    // Make execSync succeed without throwing
    vi.mocked(execSync).mockImplementationOnce(() => {
      return Buffer.from('');
    });

    expect(() => {
      dartValidateFormat({
        verbose: false,
        files: [
          'lib/main.dart',
          'lib/models/user.g.dart',
          'lib/models/user.freezed.dart',
        ],
      });
    }).toThrow('process.exit(0)');

    // Should only format main.dart, not the generated files
    const execCalls = vi.mocked(execSync).mock.calls;
    const formatCall = execCalls.find((call) =>
      call[0].toString().includes('dart format')
    );
    expect(formatCall).toBeDefined();
    expect(formatCall![0].toString()).not.toContain('user.g.dart');
    expect(formatCall![0].toString()).not.toContain('user.freezed.dart');
  });
});
