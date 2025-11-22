import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartHookDcmCheck } from './dart-hook-dcm-check.js';
import * as gitUtils from '../utils/git.js';
import * as dartUtils from '../utils/dart.js';
import { execSync } from 'node:child_process';
vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
}));
describe('dartHookDcmCheck', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let isGitRepoSpy;
    let isDartPackageSpy;
    let getAllChangedFilesSpy;
    let hasUnstagedChangesSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning: DCM not installed, skipping');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with error if not in a git repository', () => {
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not in a git repository');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with error if not in a Dart package', () => {
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Not in a Dart package');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with success if no Dart source files modified', () => {
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No Dart source files modified');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with success if only generated files are modified', () => {
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No Dart source files modified');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should run dcm fix and exit with success if no changes created', () => {
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
        hasUnstagedChangesSpy.mockReturnValue(false);
        expect(() => {
            dartHookDcmCheck({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ All files pass DCM checks');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with error if dcm fix creates changes', () => {
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
        hasUnstagedChangesSpy.mockReturnValue(true);
        expect(() => {
            dartHookDcmCheck({ verbose: false });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ Push blocked: DCM fixes were applied. Please stage and commit these changes:');
        expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should handle multiple files with changes', () => {
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
        hasUnstagedChangesSpy.mockReturnValue(true);
        expect(() => {
            dartHookDcmCheck({ verbose: false });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('lib/user.dart');
        expect(consoleErrorSpy).toHaveBeenCalledWith('lib/main.dart');
        expect(consoleErrorSpy).toHaveBeenCalledWith('lib/utils.dart');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with error if dcm fix command fails', () => {
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
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to run dcm fix');
        expect(consoleErrorSpy).toHaveBeenCalledWith('dcm fix failed');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
//# sourceMappingURL=dart-hook-dcm-check.test.js.map