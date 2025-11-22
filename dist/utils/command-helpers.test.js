import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ensureCondition, ensureDartInstalled, ensureDCMInstalled, ensureClaudeInstalled, displayChangedFiles, getChangedFilesWithOptions, displayFileList, } from './command-helpers.js';
import * as git from '../commands/git/utils/git.js';
import * as shell from './shell.js';
describe('ensureCondition', () => {
    let consoleErrorSpy;
    let processExitSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        vi.clearAllMocks();
    });
    describe('basic behavior', () => {
        it('should do nothing when condition is true', () => {
            expect(() => {
                ensureCondition(true, 'Error message');
            }).not.toThrow();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });
        it('should exit with code 1 and log error when condition is false', () => {
            expect(() => {
                ensureCondition(false, 'Error: Something went wrong');
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Something went wrong');
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
        it('should not log error when condition is false and errorMessage is empty', () => {
            expect(() => {
                ensureCondition(false, '');
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });
    describe('verbose mode', () => {
        it('should log success message when condition is true and verbose is true', () => {
            ensureCondition(true, 'Error message', {
                verbose: true,
                successMessage: '✓ Success!',
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith('✓ Success!');
            expect(processExitSpy).not.toHaveBeenCalled();
        });
        it('should not log success message when condition is true but verbose is false', () => {
            ensureCondition(true, 'Error message', {
                verbose: false,
                successMessage: '✓ Success!',
            });
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });
        it('should not log success message when verbose is true but successMessage is not provided', () => {
            ensureCondition(true, 'Error message', {
                verbose: true,
            });
            expect(consoleErrorSpy).not.toHaveBeenCalled();
            expect(processExitSpy).not.toHaveBeenCalled();
        });
    });
    describe('custom exit codes', () => {
        it('should use custom exit code when provided', () => {
            expect(() => {
                ensureCondition(false, 'Warning message', { exitCode: 0 });
            }).toThrow('process.exit(0)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Warning message');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });
        it('should use exit code 2 when specified', () => {
            expect(() => {
                ensureCondition(false, 'Custom error', { exitCode: 2 });
            }).toThrow('process.exit(2)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Custom error');
            expect(processExitSpy).toHaveBeenCalledWith(2);
        });
        it('should default to exit code 1 when not specified', () => {
            expect(() => {
                ensureCondition(false, 'Error');
            }).toThrow('process.exit(1)');
            expect(processExitSpy).toHaveBeenCalledWith(1);
        });
    });
    describe('combined options', () => {
        it('should handle verbose and custom exit code together', () => {
            expect(() => {
                ensureCondition(false, '⚠️  Warning', {
                    exitCode: 0,
                    verbose: true,
                    successMessage: '✓ All good',
                });
            }).toThrow('process.exit(0)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning');
            expect(consoleErrorSpy).not.toHaveBeenCalledWith('✓ All good');
            expect(processExitSpy).toHaveBeenCalledWith(0);
        });
        it('should log success message with custom exit code when condition is true', () => {
            ensureCondition(true, 'Error', {
                exitCode: 0,
                verbose: true,
                successMessage: '✓ Success',
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith('✓ Success');
            expect(processExitSpy).not.toHaveBeenCalled();
        });
    });
});
describe('ensureDartInstalled', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let isCommandInstalledSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
        isCommandInstalledSpy = vi.spyOn(shell, 'isCommandInstalled');
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        isCommandInstalledSpy.mockRestore();
        vi.clearAllMocks();
    });
    it('should do nothing when dart is installed', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        expect(() => {
            ensureDartInstalled();
        }).not.toThrow();
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dart');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(processExitSpy).not.toHaveBeenCalled();
    });
    it('should exit with code 0 when dart is not installed and verbose is false', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            ensureDartInstalled(false);
        }).toThrow('process.exit(0)');
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dart');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with code 0 and show warning when dart is not installed and verbose is true', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            ensureDartInstalled(true);
        }).toThrow('process.exit(0)');
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dart');
        expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning: dart not installed, skipping');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
});
describe('ensureDCMInstalled', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let isCommandInstalledSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
        isCommandInstalledSpy = vi.spyOn(shell, 'isCommandInstalled');
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        isCommandInstalledSpy.mockRestore();
        vi.clearAllMocks();
    });
    it('should do nothing when DCM is installed', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        expect(() => {
            ensureDCMInstalled();
        }).not.toThrow();
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dcm');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(processExitSpy).not.toHaveBeenCalled();
    });
    it('should exit with code 0 when DCM is not installed and verbose is false', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            ensureDCMInstalled(false);
        }).toThrow('process.exit(0)');
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dcm');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with code 0 and show warning when DCM is not installed and verbose is true', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            ensureDCMInstalled(true);
        }).toThrow('process.exit(0)');
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('dcm');
        expect(consoleErrorSpy).toHaveBeenCalledWith('⚠️  Warning: DCM not installed, skipping');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
});
describe('ensureClaudeInstalled', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let isCommandInstalledSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
        isCommandInstalledSpy = vi.spyOn(shell, 'isCommandInstalled');
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        isCommandInstalledSpy.mockRestore();
        vi.clearAllMocks();
    });
    it('should do nothing when Claude is installed', () => {
        isCommandInstalledSpy.mockReturnValue(true);
        expect(() => {
            ensureClaudeInstalled();
        }).not.toThrow();
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('claude');
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        expect(processExitSpy).not.toHaveBeenCalled();
    });
    it('should exit with code 1 and show error when Claude is not installed', () => {
        isCommandInstalledSpy.mockReturnValue(false);
        expect(() => {
            ensureClaudeInstalled();
        }).toThrow('process.exit(1)');
        expect(isCommandInstalledSpy).toHaveBeenCalledWith('claude');
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Claude CLI not found. Please install it from https://github.com/anthropics/claude-cli');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
});
describe('displayChangedFiles', () => {
    let consoleLogSpy;
    let consoleErrorSpy;
    let processExitSpy;
    let getChangedFilesMock;
    beforeEach(() => {
        consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
        getChangedFilesMock = vi.spyOn(git, 'getChangedFiles');
    });
    afterEach(() => {
        consoleLogSpy.mockRestore();
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        getChangedFilesMock.mockRestore();
        vi.clearAllMocks();
    });
    describe('basic behavior', () => {
        it('should display committed files by default', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.ts']);
            displayChangedFiles({});
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'committed',
                baseBranch: 'main',
            });
            expect(consoleLogSpy).toHaveBeenCalledWith('file1.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('file2.ts');
        });
        it('should display staged files when staged option is true', () => {
            getChangedFilesMock.mockReturnValue(['staged1.ts', 'staged2.ts']);
            displayChangedFiles({ staged: true });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'staged',
                baseBranch: 'main',
            });
            expect(consoleLogSpy).toHaveBeenCalledWith('staged1.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('staged2.ts');
        });
        it('should display unstaged files when unstaged option is true', () => {
            getChangedFilesMock.mockReturnValue(['unstaged1.ts', 'unstaged2.ts']);
            displayChangedFiles({ unstaged: true });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'unstaged',
                baseBranch: 'main',
            });
            expect(consoleLogSpy).toHaveBeenCalledWith('unstaged1.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('unstaged2.ts');
        });
        it('should exit silently when no files are found', () => {
            getChangedFilesMock.mockReturnValue([]);
            displayChangedFiles({});
            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        it('should exit with error when getChangedFiles returns null', () => {
            getChangedFilesMock.mockReturnValue(null);
            expect(() => {
                displayChangedFiles({});
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to get changed files');
        });
    });
    describe('with custom base branch', () => {
        it('should use custom base branch', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts']);
            displayChangedFiles({ baseBranch: 'develop' });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'committed',
                baseBranch: 'develop',
            });
        });
    });
    describe('with filter function', () => {
        it('should filter files based on provided filter function', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.dart', 'file3.ts']);
            const filter = (file) => file.endsWith('.dart');
            displayChangedFiles({ filter });
            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith('file2.dart');
        });
        it('should return no files when filter excludes all', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.ts']);
            const filter = (file) => file.endsWith('.dart');
            displayChangedFiles({ filter });
            expect(consoleLogSpy).not.toHaveBeenCalled();
        });
    });
    describe('verbose mode', () => {
        it('should display header for committed files in verbose mode', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.ts']);
            displayChangedFiles({ verbose: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Changed files compared to main (2):');
            expect(consoleLogSpy).toHaveBeenCalledWith('file1.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('file2.ts');
        });
        it('should display header for staged files in verbose mode', () => {
            getChangedFilesMock.mockReturnValue(['staged.ts']);
            displayChangedFiles({ staged: true, verbose: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Staged files (1):');
        });
        it('should display header for unstaged files in verbose mode', () => {
            getChangedFilesMock.mockReturnValue(['unstaged.ts']);
            displayChangedFiles({ unstaged: true, verbose: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Unstaged files (1):');
        });
        it('should include typePrefix in verbose headers', () => {
            getChangedFilesMock.mockReturnValue(['file.dart']);
            displayChangedFiles({ verbose: true, typePrefix: 'Dart' });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Changed Dart files compared to main (1):');
        });
    });
    describe('--all option', () => {
        it('should display all changed files with type prefixes', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts'])
                .mockReturnValueOnce(['staged.ts'])
                .mockReturnValueOnce(['unstaged.ts']);
            displayChangedFiles({ all: true });
            expect(getChangedFilesMock).toHaveBeenCalledTimes(3);
            expect(consoleLogSpy).toHaveBeenCalledWith('committed:committed.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('staged:staged.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('unstaged:unstaged.ts');
        });
        it('should exit silently when no files in any category with --all', () => {
            getChangedFilesMock.mockReturnValueOnce([]).mockReturnValueOnce([]).mockReturnValueOnce([]);
            displayChangedFiles({ all: true });
            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        it('should display verbose headers for each category with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts'])
                .mockReturnValueOnce(['staged.ts'])
                .mockReturnValueOnce(['unstaged.ts']);
            displayChangedFiles({ all: true, verbose: true });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Committed changes (compared to main) (1):');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Staged changes (1):');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Unstaged changes (1):');
        });
        it('should include typePrefix in --all verbose headers', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['file.dart'])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            displayChangedFiles({
                all: true,
                verbose: true,
                typePrefix: 'Dart',
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Committed Dart changes (compared to main) (1):');
        });
        it('should not display headers for empty categories in verbose mode', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts'])
                .mockReturnValueOnce([])
                .mockReturnValueOnce([]);
            displayChangedFiles({ all: true, verbose: true });
            expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
            expect(consoleErrorSpy).toHaveBeenCalledWith('Committed changes (compared to main) (1):');
        });
        it('should exit with error when any category returns null with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts'])
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(['unstaged.ts']);
            expect(() => {
                displayChangedFiles({ all: true });
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to get changed files');
        });
        it('should apply filter to all categories with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['file.ts', 'file.dart'])
                .mockReturnValueOnce(['staged.dart'])
                .mockReturnValueOnce(['unstaged.ts']);
            const filter = (file) => file.endsWith('.dart');
            displayChangedFiles({ all: true, filter });
            expect(consoleLogSpy).toHaveBeenCalledTimes(2);
            expect(consoleLogSpy).toHaveBeenCalledWith('committed:file.dart');
            expect(consoleLogSpy).toHaveBeenCalledWith('staged:staged.dart');
        });
    });
    describe('with --push option', () => {
        let getFilesToPushMock;
        beforeEach(() => {
            getFilesToPushMock = vi.spyOn(git, 'getFilesToPush');
        });
        afterEach(() => {
            getFilesToPushMock.mockRestore();
        });
        it('should display files to push', () => {
            getFilesToPushMock.mockReturnValue(['file1.ts', 'file2.ts']);
            displayChangedFiles({ push: true, verbose: true });
            expect(getFilesToPushMock).toHaveBeenCalled();
            expect(consoleLogSpy).toHaveBeenCalledWith('file1.ts');
            expect(consoleLogSpy).toHaveBeenCalledWith('file2.ts');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        it('should exit with error when getFilesToPush returns null', () => {
            getFilesToPushMock.mockReturnValue(null);
            expect(() => {
                displayChangedFiles({ push: true });
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Remote branch not found or not in a git repository');
        });
        it('should exit silently when no files to push', () => {
            getFilesToPushMock.mockReturnValue([]);
            displayChangedFiles({ push: true });
            expect(consoleLogSpy).not.toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });
        it('should apply filter to push files', () => {
            getFilesToPushMock.mockReturnValue(['file1.ts', 'file2.dart']);
            const filter = (file) => file.endsWith('.dart');
            displayChangedFiles({ push: true, filter });
            expect(consoleLogSpy).toHaveBeenCalledTimes(1);
            expect(consoleLogSpy).toHaveBeenCalledWith('file2.dart');
        });
    });
});
describe('getChangedFilesWithOptions', () => {
    let consoleErrorSpy;
    let processExitSpy;
    let getChangedFilesMock;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
            throw new Error(`process.exit(${code})`);
        });
        getChangedFilesMock = vi.spyOn(git, 'getChangedFiles');
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        processExitSpy.mockRestore();
        getChangedFilesMock.mockRestore();
        vi.clearAllMocks();
    });
    describe('basic behavior', () => {
        it('should return committed files by default', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.ts']);
            const files = getChangedFilesWithOptions({});
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'committed',
                baseBranch: 'main',
            });
            expect(files).toEqual(['file1.ts', 'file2.ts']);
        });
        it('should return staged files when staged option is true', () => {
            getChangedFilesMock.mockReturnValue(['staged.ts']);
            const files = getChangedFilesWithOptions({ staged: true });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'staged',
                baseBranch: 'main',
            });
            expect(files).toEqual(['staged.ts']);
        });
        it('should return unstaged files when unstaged option is true', () => {
            getChangedFilesMock.mockReturnValue(['unstaged.ts']);
            const files = getChangedFilesWithOptions({ unstaged: true });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'unstaged',
                baseBranch: 'main',
            });
            expect(files).toEqual(['unstaged.ts']);
        });
        it('should return empty array when no files are found', () => {
            getChangedFilesMock.mockReturnValue([]);
            const files = getChangedFilesWithOptions({});
            expect(files).toEqual([]);
        });
        it('should exit with error when getChangedFiles returns null', () => {
            getChangedFilesMock.mockReturnValue(null);
            expect(() => {
                getChangedFilesWithOptions({});
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to get changed files');
        });
    });
    describe('with custom base branch', () => {
        it('should use custom base branch', () => {
            getChangedFilesMock.mockReturnValue(['file.ts']);
            const files = getChangedFilesWithOptions({ baseBranch: 'develop' });
            expect(getChangedFilesMock).toHaveBeenCalledWith({
                type: 'committed',
                baseBranch: 'develop',
            });
            expect(files).toEqual(['file.ts']);
        });
    });
    describe('with filter function', () => {
        it('should filter files based on provided filter function', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.dart', 'file3.ts']);
            const filter = (file) => file.endsWith('.dart');
            const files = getChangedFilesWithOptions({ filter });
            expect(files).toEqual(['file2.dart']);
        });
        it('should return empty array when filter excludes all files', () => {
            getChangedFilesMock.mockReturnValue(['file1.ts', 'file2.ts']);
            const filter = (file) => file.endsWith('.dart');
            const files = getChangedFilesWithOptions({ filter });
            expect(files).toEqual([]);
        });
    });
    describe('--all option', () => {
        it('should combine all changed files with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts', 'shared.ts'])
                .mockReturnValueOnce(['staged.ts', 'shared.ts'])
                .mockReturnValueOnce(['unstaged.ts']);
            const files = getChangedFilesWithOptions({ all: true });
            expect(getChangedFilesMock).toHaveBeenCalledTimes(3);
            expect(files).toContain('committed.ts');
            expect(files).toContain('staged.ts');
            expect(files).toContain('unstaged.ts');
            expect(files).toContain('shared.ts');
            expect(files.length).toBe(4);
        });
        it('should deduplicate files with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['file.ts'])
                .mockReturnValueOnce(['file.ts'])
                .mockReturnValueOnce(['file.ts']);
            const files = getChangedFilesWithOptions({ all: true });
            expect(files).toEqual(['file.ts']);
        });
        it('should return empty array when no files in any category with --all', () => {
            getChangedFilesMock.mockReturnValueOnce([]).mockReturnValueOnce([]).mockReturnValueOnce([]);
            const files = getChangedFilesWithOptions({ all: true });
            expect(files).toEqual([]);
        });
        it('should exit with error when any category returns null with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['committed.ts'])
                .mockReturnValueOnce(null)
                .mockReturnValueOnce(['unstaged.ts']);
            expect(() => {
                getChangedFilesWithOptions({ all: true });
            }).toThrow('process.exit(1)');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Failed to get changed files');
        });
        it('should apply filter to all categories with --all', () => {
            getChangedFilesMock
                .mockReturnValueOnce(['file1.ts', 'file1.dart'])
                .mockReturnValueOnce(['file2.dart'])
                .mockReturnValueOnce(['file3.ts']);
            const filter = (file) => file.endsWith('.dart');
            const files = getChangedFilesWithOptions({ all: true, filter });
            expect(files).toContain('file1.dart');
            expect(files).toContain('file2.dart');
            expect(files.length).toBe(2);
        });
    });
});
describe('displayFileList', () => {
    let consoleErrorSpy;
    beforeEach(() => {
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        consoleErrorSpy.mockRestore();
        vi.clearAllMocks();
    });
    it('should display files with message in verbose mode', () => {
        displayFileList({
            files: ['file1.dart', 'file2.dart'],
            verbose: true,
            message: 'Running DCM analyze on',
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Running DCM analyze on 2 file(s):');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  file1.dart');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  file2.dart');
    });
    it('should display files with default message when message not provided', () => {
        displayFileList({
            files: ['test.dart'],
            verbose: true,
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Processing 1 file(s):');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  test.dart');
    });
    it('should not display anything when verbose is false', () => {
        displayFileList({
            files: ['file1.dart', 'file2.dart'],
            verbose: false,
            message: 'Running DCM analyze on',
        });
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
    it('should not display anything when files array is empty', () => {
        displayFileList({
            files: [],
            verbose: true,
            message: 'Running DCM analyze on',
        });
        expect(consoleErrorSpy).not.toHaveBeenCalled();
    });
    it('should handle single file correctly', () => {
        displayFileList({
            files: ['single.dart'],
            verbose: true,
            message: 'Formatting',
        });
        expect(consoleErrorSpy).toHaveBeenCalledWith('Formatting 1 file(s):');
        expect(consoleErrorSpy).toHaveBeenCalledWith('  single.dart');
    });
});
