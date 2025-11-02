import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartFix } from './dart-fix.js';
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
}));

describe('dartFix', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isCommandInstalledSpy: any;
  let escapeShellArgSpy: any;
  let findAffectedPackagesSpy: any;
  let existsSyncSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isCommandInstalledSpy = vi.spyOn(shellUtils, 'isCommandInstalled');
    escapeShellArgSpy = vi.spyOn(shellUtils, 'escapeShellArg').mockImplementation((arg) => `'${arg}'`);
    findAffectedPackagesSpy = vi.spyOn(dartUtils, 'findAffectedPackages');
    existsSyncSpy = vi.mocked(existsSync);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isCommandInstalledSpy.mockRestore();
    escapeShellArgSpy.mockRestore();
    findAffectedPackagesSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with success if dart is not installed', () => {
    isCommandInstalledSpy.mockReturnValue(false);

    expect(() => {
      dartFix({ verbose: true, files: ['test.dart'] });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  Warning: dart not installed, skipping'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if no files provided', () => {
    isCommandInstalledSpy.mockReturnValue(true);

    expect(() => {
      dartFix({ verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error: No files provided. Use --files to specify files to check.'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it.skip('should run dart fix on individual files by default', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue('No issues found!');

    expect(() => {
      dartFix({
        verbose: true,
        files: ['lib/main.dart', 'lib/utils.dart'],
      });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringMatching(/^dart fix --dry-run.*lib\/main\.dart.*lib\/utils\.dart$/),
      expect.objectContaining({ cwd: expect.any(String) })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should run dart fix on packages when --packages flag is used', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    findAffectedPackagesSpy.mockReturnValue(
      new Map([
        ['packages/app', 'app'],
        ['packages/core', 'core'],
      ])
    );
    existsSyncSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue('No issues found!');

    expect(() => {
      dartFix({
        verbose: true,
        files: ['packages/app/lib/main.dart', 'packages/core/lib/utils.dart'],
        packages: true,
      });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      'dart fix --dry-run',
      expect.objectContaining({ cwd: expect.stringContaining('packages/app') })
    );
    expect(execSync).toHaveBeenCalledWith(
      'dart fix --dry-run',
      expect.objectContaining({ cwd: expect.stringContaining('packages/core') })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it.skip('should run dart fix with --apply when apply option is true', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue('Applied fixes');

    expect(() => {
      dartFix({ verbose: true, apply: true, files: ['lib/main.dart'] });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringMatching(/^dart fix --apply.*lib\/main\.dart$/),
      expect.objectContaining({ cwd: expect.any(String) })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if fixes are suggested in dry-run mode', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue('3 suggested fixes available');

    expect(() => {
      dartFix({ verbose: true, files: ['lib/main.dart'] });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  Suggested fixes available'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '💡 Run with --apply to automatically apply fixes'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with error if dart fix command fails', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error('dart fix failed');
    });

    expect(() => {
      dartFix({ verbose: true, files: ['lib/main.dart'] });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ dart fix failed');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it.skip('should handle specific files', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    vi.mocked(execSync).mockReturnValue('No issues found!');

    expect(() => {
      dartFix({
        verbose: true,
        files: ['lib/main.dart'],
      });
    }).toThrow('process.exit(0)');

    expect(execSync).toHaveBeenCalledWith(
      expect.stringMatching(/^dart fix --dry-run.*lib\/main\.dart$/),
      expect.objectContaining({ cwd: expect.any(String) })
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if package path does not exist when using --packages', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    findAffectedPackagesSpy.mockReturnValue(
      new Map([['packages/app', 'app']])
    );
    existsSyncSpy.mockReturnValue(false);

    expect(() => {
      dartFix({ verbose: true, files: ['packages/app/lib/main.dart'], packages: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Error: Package path not found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if no affected packages found when using --packages', () => {
    isCommandInstalledSpy.mockReturnValue(true);
    findAffectedPackagesSpy.mockReturnValue(new Map());

    expect(() => {
      dartFix({ verbose: true, files: ['README.md'], packages: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ No Dart packages to check with dart fix'
    );
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });
});
