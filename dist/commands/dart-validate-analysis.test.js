import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartValidateAnalysis } from './dart-validate-analysis.js';
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
describe('dartValidateAnalysis', () => {
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
    it('should exit with error if dart is not installed', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            dartValidateAnalysis({ verbose: false });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error: dart command not found. Please install Dart SDK.');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should exit with success if no staged Dart files to analyze', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue([]);
        expect(() => {
            dartValidateAnalysis({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ No staged Dart files to analyze');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should analyze affected packages', () => {
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
        vi.mocked(execSync).mockReturnValue(Buffer.from(''));
        expect(() => {
            dartValidateAnalysis({ verbose: true });
        }).toThrow('process.exit(0)');
        expect(execSync).toHaveBeenCalledWith('dart analyze --fatal-infos', expect.objectContaining({ cwd: expect.stringContaining('packages/app') }));
        expect(execSync).toHaveBeenCalledWith('dart analyze --fatal-infos', expect.objectContaining({ cwd: expect.stringContaining('packages/core') }));
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with error if analysis fails', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        getChangedFilesSpy.mockReturnValue(['packages/app/lib/main.dart']);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockImplementation(() => {
            throw new Error('Analysis failed');
        });
        expect(() => {
            dartValidateAnalysis({ verbose: true });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('❌ app analysis failed');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should handle specific files', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        findAffectedPackagesSpy.mockReturnValue(new Map([['packages/app', 'app']]));
        existsSyncSpy.mockReturnValue(true);
        vi.mocked(execSync).mockReturnValue(Buffer.from(''));
        expect(() => {
            dartValidateAnalysis({
                verbose: true,
                files: ['packages/app/lib/main.dart'],
            });
        }).toThrow('process.exit(0)');
        expect(execSync).toHaveBeenCalledWith('dart analyze --fatal-infos', expect.objectContaining({ cwd: expect.stringContaining('packages/app') }));
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
});
//# sourceMappingURL=dart-validate-analysis.test.js.map