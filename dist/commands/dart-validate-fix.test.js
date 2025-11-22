import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartValidateFix } from './dart-validate-fix.js';
import * as gitUtils from '../utils/git.js';
import * as dartUtils from '../utils/dart.js';
import * as shellUtils from '../utils/shell.js';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';
vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
}));
vi.mock('node:fs', () => ({
    existsSync: vi.fn(),
}));
describe('dartValidateFix', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let isCommandInstalledSpy;
    let getChangedFilesSpy;
    let findAffectedPackagesSpy;
    let existsSyncSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
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
    it('should exit with success if dart is not installed', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning: dart not installed, skipping');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with success if no staged Dart files to check', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue([]);
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No staged Dart files to check with dart fix');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should run dart fix in dry-run mode by default', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue([
            'packages/app/lib/main.dart',
            'packages/core/lib/utils.dart',
        ]);
        findAffectedPackagesSpy.mockReturnValue(new Map([
            ['packages/app', 'app'],
            ['packages/core', 'core'],
        ]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockReturnValue('No issues found!');
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(execSync).toHaveBeenCalledWith('dart fix --dry-run', expect.objectContaining({ cwd: expect.stringContaining('packages/app') }));
        expect(execSync).toHaveBeenCalledWith('dart fix --dry-run', expect.objectContaining({ cwd: expect.stringContaining('packages/core') }));
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should run dart fix with --apply when apply option is true', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockReturnValue('Applied fixes');
        expect(() => {
            dartValidateFix({ verbose: true, apply: true });
        }).toThrow('process.exit(0)');
        expect(execSync).toHaveBeenCalledWith('dart fix --apply', expect.objectContaining({ cwd: expect.stringContaining('packages/app') }));
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with error if fixes are suggested in dry-run mode', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockReturnValue('3 suggested fixes available');
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  app has suggested fixes available');
        expect(consoleErrorSpy).toHaveBeenCalledWith('💡 Run with --apply to automatically apply fixes');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with error if dart fix command fails', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('dart fix failed');
        });
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ app dart fix failed');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should handle specific files', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockReturnValue('No issues found!');
        expect(() => {
            dartValidateFix({
                verbose: true,
                files: ['packages/app/lib/main.dart'],
            });
        }).toThrow('process.exit(0)');
        expect(execSync).toHaveBeenCalledWith('dart fix --dry-run', expect.objectContaining({ cwd: expect.stringContaining('packages/app') }));
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with error if package path does not exist', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(false);
        expect(() => {
            dartValidateFix({ verbose: true });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error: Package path not found'));
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with success if no affected packages found', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        findAffectedPackagesSpy.mockReturnValue(new Map());
        expect(() => {
            dartValidateFix({ verbose: true, files: ['README.md'] });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No Dart packages to check with dart fix');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
});
//# sourceMappingURL=dart-validate-fix.test.js.map