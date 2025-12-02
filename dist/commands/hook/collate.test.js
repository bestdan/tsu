import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hookCollate } from './collate.js';
import * as gitUtils from '../git/utils/git.js';
import * as dartUtils from '../dart/utils/dart.js';
import { execSync, execFile } from 'node:child_process';
vi.mock('node:child_process', () => ({
    execSync: vi.fn(),
    execFile: vi.fn(),
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
                        resolve({ stdout: stdout || '', stderr: stderr || '' });
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
    const mockExecFile = vi.mocked(execFile);
    const mockIsGitRepo = vi.mocked(gitUtils.isGitRepo);
    const mockIsDartPackage = vi.mocked(dartUtils.isDartPackage);
    const mockGetAllChangedFiles = vi.mocked(gitUtils.getAllChangedFiles);
    beforeEach(() => {
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
        mockExecFile.mockImplementation((_file, _args, _options, callback) => {
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(mockExecFile).toHaveBeenCalledTimes(3);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should only run dart-format when specified', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExecFile.mockImplementation((_file, _args, _options, callback) => {
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ dartFormat: true, verbose: false });
        expect(mockExecFile).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should track and report failures when hooks fail', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        let callCount = 0;
        mockExecFile.mockImplementation((_file, _args, _options, callback) => {
            callCount++;
            if (callback) {
                if (callCount === 1) {
                    const error = new Error('Command failed');
                    error.code = 1;
                    callback(error, '', '');
                }
                else {
                    callback(null, '', '');
                }
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
        mockExecFile.mockImplementation((_file, _args, _options, callback) => {
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(mockExecFile).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should pass changed file options to hook commands', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExecFile.mockImplementation((_file, _args, _options, callback) => {
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ staged: true, baseBranch: 'develop', verbose: true });
        const calls = mockExecFile.mock.calls;
        const hookCalls = calls.filter((call) => {
            const args = call[1];
            return args && args.includes('hook');
        });
        hookCalls.forEach((call) => {
            const args = call[1];
            expect(args).toContain('--staged');
            expect(args).toContain('--base-branch');
            expect(args).toContain('develop');
            expect(args).toContain('--verbose');
        });
        mockExit.mockRestore();
    });
    it('should run hooks concurrently, not sequentially', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart', 'schema/query.graphql']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const executionOrder = [];
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            const hookName = argsArray && argsArray.includes('format')
                ? 'format'
                : argsArray && argsArray.includes('analysis')
                    ? 'analysis'
                    : argsArray && argsArray.includes('dcm')
                        ? 'dcm'
                        : 'graphql';
            executionOrder.push(hookName);
            Promise.resolve().then(() => {
                if (callback) {
                    callback(null, '', '');
                }
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
        expect(mockExecFile).toHaveBeenCalledTimes(4);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
});
