import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gitCodeownersCheck } from './check.js';
import * as gitUtils from '../utils/git.js';
import * as shellUtils from '../../../utils/shell.js';
import { execSync } from 'node:child_process';

vi.mock('node:child_process', () => ({
  execSync: vi.fn(),
}));

describe('gitCodeownersCheck', () => {
  let consoleErrorSpy: any;
  let processExitSpy: any;
  let isGitRepoSpy: any;
  let isCommandInstalledSpy: any;
  let getGitStatusSpy: any;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
    isGitRepoSpy = vi.spyOn(gitUtils, 'isGitRepo');
    isCommandInstalledSpy = vi.spyOn(shellUtils, 'isCommandInstalled');
    getGitStatusSpy = vi.spyOn(gitUtils, 'getGitStatus');

    // Mock execSync to succeed by default
    vi.mocked(execSync).mockReturnValue('' as any);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    isGitRepoSpy.mockRestore();
    isCommandInstalledSpy.mockRestore();
    getGitStatusSpy.mockRestore();
    vi.clearAllMocks();
  });

  it('should exit with error if not in a git repository', () => {
    isGitRepoSpy.mockReturnValue(false);

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not in a git repository');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should exit with success if coach is not installed', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(false);

    expect(() => {
      gitCodeownersCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning: coach not installed, skipping');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if coach is not installed (non-verbose)', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(false);

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(0)');

    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if CODEOWNERS files are in sync', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      gitCodeownersCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('✓ CODEOWNERS files are in sync');
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with success if CODEOWNERS files are in sync (non-verbose)', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(0)');

    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with error if CODEOWNERS files are out of sync', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    getGitStatusSpy.mockReturnValueOnce('M  lib/user.dart');
    getGitStatusSpy.mockReturnValueOnce('M  lib/user.dart\nM  CODEOWNERS');

    expect(() => {
      gitCodeownersCheck({ verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ CODEOWNERS files are out of sync!');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Please run 'coach codeowners generate' locally and commit the changes to your branch."
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should display changed files when CODEOWNERS are out of sync', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    getGitStatusSpy.mockReturnValueOnce('M  lib/user.dart');
    getGitStatusSpy.mockReturnValueOnce('M  lib/user.dart\nM  CODEOWNERS\n?? .github/CODEOWNERS');

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Modified files:');
    expect(consoleErrorSpy).toHaveBeenCalledWith('   CODEOWNERS');
    expect(consoleErrorSpy).toHaveBeenCalledWith('   .github/CODEOWNERS');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should handle git status returning null before running coach', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    getGitStatusSpy.mockReturnValue(null);

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to get git status');
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should log verbose messages when verbose flag is enabled', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      gitCodeownersCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('🔍 Checking CODEOWNERS files...');
    expect(consoleErrorSpy).toHaveBeenCalledWith('🔧 Running coach codeowners generate...');
    expect(consoleErrorSpy).toHaveBeenCalledWith('✓ CODEOWNERS files are in sync');
  });

  it('should not log verbose messages when verbose flag is disabled', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(0)');

    // Should not log verbose messages
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('🔍 Checking CODEOWNERS files...');
    expect(consoleErrorSpy).not.toHaveBeenCalledWith('🔧 Running coach codeowners generate...');
  });

  it('should exit with error if there are unowned files', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    // Mock execSync to succeed for generate but fail for unowned check
    vi.mocked(execSync).mockImplementation((command: string) => {
      if (command === 'coach codeowners unowned --check') {
        const error = new Error('Unowned files found') as Error & {
          stdout: Buffer;
          stderr: Buffer;
        };
        error.stdout = Buffer.from('lib/unowned_file.dart\nlib/another_unowned.dart');
        error.stderr = Buffer.from('');
        throw error;
      }
      return '' as any;
    });

    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('❌ There are unowned files in the repository!');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Please add the necessary OWNERSHIP files to appropriately tag owners.'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unowned files:');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'lib/unowned_file.dart\nlib/another_unowned.dart'
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should log verbose messages for unowned check when verbose flag is enabled', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    expect(() => {
      gitCodeownersCheck({ verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('🔍 Checking for unowned files...');
    expect(consoleErrorSpy).toHaveBeenCalledWith('✅ No unowned files detected!');
  });

  it('should pass all checks when both generate and unowned checks succeed', () => {
    isGitRepoSpy.mockReturnValue(true);
    isCommandInstalledSpy.mockReturnValue(true);
    const gitStatus = 'M  lib/user.dart';
    getGitStatusSpy.mockReturnValue(gitStatus);

    // Both execSync calls should succeed (default mock behavior)
    expect(() => {
      gitCodeownersCheck({ verbose: false });
    }).toThrow('process.exit(0)');

    expect(processExitSpy).toHaveBeenCalledWith(0);
    // Verify both commands were called
    expect(execSync).toHaveBeenCalledWith(
      'coach codeowners generate',
      expect.objectContaining({ cwd: expect.any(String) })
    );
    expect(execSync).toHaveBeenCalledWith(
      'coach codeowners unowned --check',
      expect.objectContaining({ cwd: expect.any(String) })
    );
  });
});
