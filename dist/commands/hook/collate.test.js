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
    it('should exit with code 1 when not in a git repository', async () => {
        mockIsGitRepo.mockReturnValue(false);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }));
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        await expect(hookCollate({ verbose: false })).rejects.toThrow('process.exit called');
        expect(mockConsoleError).toHaveBeenCalledWith('Error: Not in a git repository');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should exit with code 1 when not in a Dart package', async () => {
        mockIsDartPackage.mockReturnValue(false);
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {
            throw new Error('process.exit called');
        }));
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => { });
        await expect(hookCollate({ verbose: false })).rejects.toThrow('process.exit called');
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
        expect(mockExecFile).toHaveBeenCalledTimes(4);
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
    it('should extract and display file details from format check failures', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (callback) {
                if (argsArray && argsArray.includes('format')) {
                    const error = new Error('Command failed');
                    error.code = 1;
                    error.stderr = `
❌ Push blocked: Files were formatted. Please stage and commit these changes:
lib/widget.dart
lib/helper.dart
`;
                    callback(error, '', error.stderr);
                }
                else {
                    callback(null, '', '');
                }
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const errorCalls = [];
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg) => {
            errorCalls.push(msg);
        });
        await hookCollate({ dartFormat: true, verbose: false });
        expect(errorCalls).toContain('  - dart format check');
        expect(errorCalls).toContain('    Files need formatting');
        expect(errorCalls).toContain('      lib/widget.dart');
        expect(errorCalls).toContain('      lib/helper.dart');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should extract and display file details from analysis check failures', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (callback) {
                if (argsArray && argsArray.includes('analysis')) {
                    const error = new Error('Command failed');
                    error.code = 1;
                    error.stderr = `
❌ Push blocked: dart analyze found issues in the following file(s):
  lib/api.dart
  lib/model.dart

Run \`dart fix --apply\` to fix some issues automatically.
`;
                    callback(error, '', error.stderr);
                }
                else {
                    callback(null, '', '');
                }
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const errorCalls = [];
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg) => {
            errorCalls.push(msg);
        });
        await hookCollate({ dartAnalysis: true, verbose: false });
        expect(errorCalls).toContain('  - dart analysis check');
        expect(errorCalls).toContain('    dart analyze found issues');
        expect(errorCalls).toContain('      lib/api.dart');
        expect(errorCalls).toContain('      lib/model.dart');
        expect(mockExit).toHaveBeenCalledWith(1);
        mockExit.mockRestore();
        mockConsoleError.mockRestore();
    });
    it('should handle failures without parseable output gracefully', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (callback) {
                if (argsArray && argsArray.includes('format')) {
                    const error = new Error('Some unknown error');
                    error.code = 1;
                    callback(error, '', 'Some unknown error');
                }
                else {
                    callback(null, '', '');
                }
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        const errorCalls = [];
        const mockConsoleError = vi.spyOn(console, 'error').mockImplementation((msg) => {
            errorCalls.push(msg);
        });
        await hookCollate({ dartFormat: true, verbose: false });
        expect(errorCalls).toContain('  - dart format check');
        expect(errorCalls.filter((c) => c.startsWith('    '))).toHaveLength(0);
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
        expect(mockExecFile).toHaveBeenCalledTimes(2);
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
                        : argsArray && argsArray.includes('codeowners')
                            ? 'codeowners'
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
        expect(executionOrder).toHaveLength(5);
        expect(executionOrder).toContain('format');
        expect(executionOrder).toContain('analysis');
        expect(executionOrder).toContain('dcm');
        expect(executionOrder).toContain('graphql');
        expect(executionOrder).toContain('codeowners');
        expect(mockExecFile).toHaveBeenCalledTimes(5);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should run codeowners check by default when Dart files are changed', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const calledCommands = [];
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (argsArray) {
                const commandPath = argsArray.join(' ');
                calledCommands.push(commandPath);
            }
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ verbose: false });
        expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(true);
        expect(mockExecFile).toHaveBeenCalledTimes(4);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should skip codeowners check when explicitly disabled with other flags', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const calledCommands = [];
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (argsArray) {
                const commandPath = argsArray.join(' ');
                calledCommands.push(commandPath);
            }
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ dartFormat: true, verbose: false });
        expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(false);
        expect(mockExecFile).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should run only codeowners check when specified', async () => {
        mockGetAllChangedFiles.mockReturnValue([]);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const calledCommands = [];
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (argsArray) {
                const commandPath = argsArray.join(' ');
                calledCommands.push(commandPath);
            }
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ codeowners: true, verbose: false });
        expect(calledCommands.some((cmd) => cmd.includes('git codeowners check'))).toBe(true);
        expect(mockExecFile).toHaveBeenCalledTimes(1);
        expect(mockExit).toHaveBeenCalledWith(0);
        mockExit.mockRestore();
    });
    it('should not pass changed file args to codeowners check', async () => {
        mockGetAllChangedFiles.mockReturnValue(['lib/main.dart']);
        mockExecSync.mockReturnValue(Buffer.from('/usr/bin/tsu'));
        const commandArgs = [];
        mockExecFile.mockImplementation((_file, args, _options, callback) => {
            const argsArray = args;
            if (argsArray) {
                commandArgs.push([...argsArray]);
            }
            if (callback) {
                callback(null, '', '');
            }
            return {};
        });
        const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }));
        await hookCollate({ staged: true, baseBranch: 'develop', verbose: false });
        const codeownersArgs = commandArgs.find((args) => args.includes('codeowners'));
        expect(codeownersArgs).toBeDefined();
        expect(codeownersArgs).not.toContain('--staged');
        expect(codeownersArgs).not.toContain('--base-branch');
        expect(codeownersArgs).not.toContain('develop');
        mockExit.mockRestore();
    });
});
