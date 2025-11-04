import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dartRoot } from './root.js';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to our test fixture
const fixtureDir = resolve(__dirname, '../../__fixtures__/dart-package');
const dcmFixtureDir = resolve(__dirname, '../../__fixtures__/dart-app-with-dcm');

describe('dartRoot', () => {
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

  it('should output package root when in a Dart package', () => {
    const libDir = resolve(fixtureDir, 'lib');

    expect(() => {
      dartRoot(libDir, { verbose: false });
    }).toThrow('process.exit(0)');

    expect(consoleLogSpy).toHaveBeenCalledWith(fixtureDir);
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should output package root for multi-package monorepo', () => {
    const appPackage = resolve(dcmFixtureDir, 'packages/app');
    const libDir = resolve(appPackage, 'lib');

    expect(() => {
      dartRoot(libDir, { verbose: false });
    }).toThrow('process.exit(0)');

    expect(consoleLogSpy).toHaveBeenCalledWith(appPackage);
    expect(processExitSpy).toHaveBeenCalledWith(0);
  });

  it('should exit with 1 when not in a Dart package', () => {
    expect(() => {
      dartRoot('/tmp', { verbose: false });
    }).toThrow('process.exit(1)');

    expect(processExitSpy).toHaveBeenCalledWith(1);
  });

  it('should show verbose label when verbose is true', () => {
    const libDir = resolve(fixtureDir, 'lib');

    expect(() => {
      dartRoot(libDir, { verbose: true });
    }).toThrow('process.exit(0)');

    expect(consoleErrorSpy).toHaveBeenCalledWith('Dart package root:');
    expect(consoleLogSpy).toHaveBeenCalledWith(fixtureDir);
  });

  it('should show verbose error when not in a Dart package', () => {
    expect(() => {
      dartRoot('/tmp', { verbose: true });
    }).toThrow('process.exit(1)');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('Not inside a Dart package')
    );
    expect(processExitSpy).toHaveBeenCalledWith(1);
  });
});
