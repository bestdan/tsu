import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { pipeCheck } from './check.js';
describe('pipeCheck', () => {
    let mockExit;
    let mockLog;
    let mockError;
    beforeEach(() => {
        mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
            throw new Error('process.exit called');
        });
        mockLog = vi.spyOn(console, 'log').mockImplementation(() => { });
        mockError = vi.spyOn(console, 'error').mockImplementation(() => { });
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('successful commands', () => {
        it('should show success message and exit 0 for passing command', () => {
            expect(() => {
                pipeCheck('exit 0', 'test-check');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('✅ test-check passed');
            expect(mockExit).toHaveBeenCalledWith(0);
        });
        it('should handle commands with output', () => {
            expect(() => {
                pipeCheck('echo "hello"', 'echo-test');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('✅ echo-test passed');
            expect(mockExit).toHaveBeenCalledWith(0);
        });
    });
    describe('failing commands', () => {
        it('should show failure message and exit 1 for failing command', () => {
            expect(() => {
                pipeCheck('exit 1', 'fail-check');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('❌ fail-check failed');
            expect(mockExit).toHaveBeenCalledWith(1);
        });
        it('should show failure message for non-existent command', () => {
            expect(() => {
                pipeCheck('nonexistent-command-xyz', 'bad-command');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('❌ bad-command failed');
            expect(mockExit).toHaveBeenCalled();
        });
    });
    describe('verbose mode', () => {
        it('should show command being run in verbose mode', () => {
            expect(() => {
                pipeCheck('exit 0', 'verbose-test', { verbose: true });
            }).toThrow('process.exit called');
            expect(mockError).toHaveBeenCalledWith('Running: exit 0');
            expect(mockLog).toHaveBeenCalledWith('✅ verbose-test passed');
        });
        it('should show exit code in verbose mode on failure', () => {
            expect(() => {
                pipeCheck('exit 42', 'verbose-fail', { verbose: true });
            }).toThrow('process.exit called');
            expect(mockError).toHaveBeenCalledWith('Running: exit 42');
            expect(mockError).toHaveBeenCalledWith('Exit code: 42');
            expect(mockLog).toHaveBeenCalledWith('❌ verbose-fail failed');
            expect(mockExit).toHaveBeenCalledWith(42);
        });
    });
    describe('label variations', () => {
        it('should work with different label styles', () => {
            expect(() => {
                pipeCheck('exit 0', 'format');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('✅ format passed');
            vi.clearAllMocks();
            expect(() => {
                pipeCheck('exit 0', 'analysis check');
            }).toThrow('process.exit called');
            expect(mockLog).toHaveBeenCalledWith('✅ analysis check passed');
        });
    });
});
//# sourceMappingURL=check.test.js.map