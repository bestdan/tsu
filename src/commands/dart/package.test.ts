import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartPackage } from './package.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to our test fixture
const fixtureDir = resolve(__dirname, '../../__fixtures__/dart-package');

describe('dartPackage', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let processExitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should output package root for a file in the package', () => {
    const filePath = resolve(fixtureDir, 'lib', 'main.dart');

    expect(() => {
      dartPackage(filePath, { verbose: false });
    }).toThrow('process.exit(0)');

    expect(consoleLogSpy).toHaveBeenCalledWith(fixtureDir);
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with 1 when file does not exist', () => {
    expect(() => {
      dartPackage('/fake/path/file.dart', { verbose: false });
    }).toThrow('process.exit(1)');

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show verbose label when verbose is true', () => {
    const filePath = resolve(fixtureDir, 'lib', 'main.dart');

    expect(() => {
      dartPackage(filePath, { verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Package root for')
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(fixtureDir);
  });

  it('should show verbose error when file does not exist', () => {
    expect(() => {
      dartPackage('/fake/path/file.dart', { verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('File not found')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show verbose error when not in a Dart package', () => {
    expect(() => {
      dartPackage('/tmp', { verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Not inside a Dart package')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
