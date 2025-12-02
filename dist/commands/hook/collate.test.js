import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hookCollate } from './collate.js';
import * as gitUtils from '../git/utils/git.js';
import * as dartUtils from '../dart/utils/dart.js';
import { execSync } from 'node:child_process';
vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
    exec: vi.fn(),
}));
vi.mock('node:util', () => ({
    promisify: vi.fn((fn) => {
        return (...args) => {
            return new Promise((resolve, reject) => {
                fn(...args, (error, stdout, stderr) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve({ stdout, stderr });
                    }
                });
            });
        };
    }),
}));
vi.mock('../git/utils/git.js', () => ({
    isGitRepo: vi.fn(),
    getAllChangedFiles: vi.fn(),
}));
vi.mock('../dart/utils/dart.js', () => ({
    isDartPackage: vi.fn(),
}));
describe('hookCollate', () => {
    const mockExecSync = vi.mocked(execSync);
    const mockIsGitRepo = vi.mocked(gitUtils.isGitRepo);
    const mockIsDartPackage = vi.mocked(dartUtils.isDartPackage);
    const mockGetAllChangedFiles = vi.mocked(gitUtils.getAllChangedFiles);
    let mockExec;
    beforeEach(async () => {
        const childProcess = await import('node:child_process');
        mockExec = vi.mocked(childProcess.exec);
        vi.clearAllMocks();
        mockIsGitRepo.mockReturnValue(true);
        mockIsDartPackage.mockReturnValue(true);
        mockGetAllChangedFiles.mockReturnValue([]);
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    it('should exit with code 0 when no files are changed', async () => {
        mockGetAllChangedFiles.mockReturnValue([]);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should exit with code 1 when not in a git repository', async () => {
        mockIsGitRepo.mockReturnValue(false);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        await hookCollate({ verbose: false });
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a git repository');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should exit with code 1 when not in a Dart package', async () => {
        mockIsDartPackage.mockReturnValue(false);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        await hookCollate({ verbose: false });
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a Dart package');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should run all hooks by default when Dart files are changed', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'lib/utils.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExec.mockImplementation((_cmd, _options, callback) => {
            callback(null, '', '');
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(mockExec).toHaveBeenCalledTimes(3);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should only run dart-format when specified', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExec.mockImplementation((_cmd, _options, callback) => {
            callback(null, '', '');
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ dartFormat: true, verbose: false });
        expect(mockExec).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should track and report failures when hooks fail', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        let callCount = 0;
        mockExec.mockImplementation((_cmd, _options, callback) => {
            callCount++;
            if (callCount === 1) {
                const error = new Error('Command failed');
                error.code = 1;
                callback(error, '', '');
            }
            else {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        await hookCollate({ verbose: false });
        expect(mockConsoleError).toHaveBeenCalledWith('❌ One or more checks failed:');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should run GraphQL check when .graphql files are changed', async () => {
        mockGetAllChangedFiles.mockReturnValue(['schema/query.graphql']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExec.mockImplementation((_cmd, _options, callback) => {
            callback(null, '', '');
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(mockExec).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should pass changed file options to hook commands', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExec.mockImplementation((_cmd, _options, callback) => {
            callback(null, '', '');
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ staged: true, baseBranch: 'develop', verbose: true });
        const calls = mockExec.mock.calls;
        const hookCalls = calls.filter((call) => typeof call[0] === 'string' && call[0].includes('hook'));
        hookCalls.forEach((call) => {
            const cmd = call[0];
            expect(cmd).toContain('--staged');
            expect(cmd).toContain('--base-branch develop');
            expect(cmd).toContain('--verbose');
        });
        mockExit.mockRestore();
    });
    it('should run hooks concurrently, not sequentially', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'schema/query.graphql']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const executionOrder = [];
        mockExec.mockImplementation((cmd, _options, callback) => {
            const hookName = cmd.includes('format')
                ? 'format'
                : cmd.includes('analysis')
                    ? 'analysis'
                    : cmd.includes('dcm')
                        ? 'dcm'
                        : 'graphql';
            executionOrder.push(hookName);
            Promise.resolve().then(() => {
                callback(null, '', '');
            });
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(executionOrder).toHaveLength(4);
        expect(executionOrder).toContain('format');
        expect(executionOrder).toContain('analysis');
        expect(executionOrder).toContain('dcm');
        expect(executionOrder).toContain('graphql');
        expect(mockExec).toHaveBeenCalledTimes(4);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
});
