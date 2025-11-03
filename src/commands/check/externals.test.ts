import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkExternals } from './externals.js';
import * as shell from '../../utils/shell.js';

// Mock the shell utilities
vi.mock('../../utils/shell.js', () => ({
  isCommandInstalled: vi.fn(),
}));

describe('checkExternals', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;
  let exitSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`process.exit(${code})`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should exit with code 0 when all dependencies are installed', () => {
    vi.mocked(shell.isCommandInstalled).mockReturnValue(true);

    expect(() => checkExternals()).toThrow('process.exit(0)');

    expect(exitSpy).toHaveBeenCalledWith(0);
    expect(consoleLogSpy).toHaveBeenCalledWith('dart: installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('dcm: installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('melos: installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('claude: installed');
  });

  it('should exit with code 1 when some dependencies are not installed', () => {
    vi.mocked(shell.isCommandInstalled).mockImplementation((cmd: string) => {
      return cmd !== 'dcm' && cmd !== 'melos';
    });

    expect(() => checkExternals()).toThrow('process.exit(1)');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('dart: installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('dcm: not_installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('melos: not_installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('claude: installed');
  });

  it('should exit with code 1 when no dependencies are installed', () => {
    vi.mocked(shell.isCommandInstalled).mockReturnValue(false);

    expect(() => checkExternals()).toThrow('process.exit(1)');

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('dart: not_installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('dcm: not_installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('melos: not_installed');
    expect(consoleLogSpy).toHaveBeenCalledWith('claude: not_installed');
  });

  it('should show verbose output when verbose flag is enabled', () => {
    vi.mocked(shell.isCommandInstalled).mockImplementation((cmd: string) => {
      return cmd === 'dart' || cmd === 'claude';
    });

    expect(() => checkExternals({ verbose: true })).toThrow(
      'process.exit(1)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '🔍 Checking external dependencies...'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ Dart SDK (dart) - installed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith('✗ DCM (dcm) - not installed');
    expect(consoleErrorSpy).toHaveBeenCalledWith('  Install: https://dcm.dev');
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✗ Melos (melos) - not installed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '  Install: https://melos.invertase.dev'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ Claude CLI (claude) - installed'
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '⚠️  Some external dependencies are not installed'
    );
  });

  it('should show success message in verbose mode when all are installed', () => {
    vi.mocked(shell.isCommandInstalled).mockReturnValue(true);

    expect(() => checkExternals({ verbose: true })).toThrow(
      'process.exit(0)'
    );

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      '✓ All external dependencies are installed'
    );
  });

  it('should output parseable format to stdout for scripting', () => {
    vi.mocked(shell.isCommandInstalled).mockImplementation((cmd: string) => {
      return cmd === 'dart';
    });

    expect(() => checkExternals()).toThrow('process.exit(1)');

    // Verify parseable output
    const outputs = consoleLogSpy.mock.calls.map((call: any) => call[0]);
    expect(outputs).toContain('dart: installed');
    expect(outputs).toContain('dcm: not_installed');
    expect(outputs).toContain('melos: not_installed');
    expect(outputs).toContain('claude: not_installed');
  });
});
