import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartCheck } from './dart-check.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixtureDir = resolve(__dirname, '../__fixtures__/dart-package');
describe('dartCheck', () => {
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
    });
    it('should exit with 0 when in a Dart package', () => {
        expect(() => {
            dartCheck(fixtureDir, { verbose: false });
        }).toThrow('process.exit(0)');
        expect(processExitSpy).toHaveBeenCalledWith(0);
    });
    it('should exit with 1 when not in a Dart package', () => {
        expect(() => {
            dartCheck('/tmp', { verbose: false });
        }).toThrow('process.exit(1)');
        expect(processExitSpy).toHaveBeenCalledWith(1);
    });
    it('should show verbose message when in Dart package', () => {
        expect(() => {
            dartCheck(fixtureDir, { verbose: true });
        }).toThrow('process.exit(0)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✓ Inside a Dart package');
    });
    it('should show verbose message when not in Dart package', () => {
        expect(() => {
            dartCheck('/tmp', { verbose: true });
        }).toThrow('process.exit(1)');
        expect(consoleErrorSpy).toHaveBeenCalledWith('✗ Not inside a Dart package');
    });
});
//# sourceMappingURL=dart-check.test.js.map