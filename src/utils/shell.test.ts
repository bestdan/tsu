import { describe, it, expect } from 'vitest';
import { escapeShellArg, isSafeShellInput, safeShellArg } from './shell.js';

describe('escapeShellArg', () => {
  it('should escape single quotes', () => {
    expect(escapeShellArg("file's name.txt")).toBe("'file'\\''s name.txt'");
  });

  it('should handle strings without special characters', () => {
    expect(escapeShellArg('simple.txt')).toBe("'simple.txt'");
  });

  it('should handle multiple single quotes', () => {
    expect(escapeShellArg("it's a test's file")).toBe("'it'\\''s a test'\\''s file'");
  });

  it('should handle empty string', () => {
    expect(escapeShellArg('')).toBe("''");
  });

  it('should handle strings with spaces', () => {
    expect(escapeShellArg('file name with spaces.txt')).toBe("'file name with spaces.txt'");
  });
});

describe('isSafeShellInput', () => {
  it('should allow safe filenames', () => {
    expect(isSafeShellInput('file.txt')).toBe(true);
    expect(isSafeShellInput('my_file.txt')).toBe(true);
    expect(isSafeShellInput('file-name.txt')).toBe(true);
    expect(isSafeShellInput('file123.txt')).toBe(true);
  });

  it('should allow paths with slashes', () => {
    expect(isSafeShellInput('path/to/file.txt')).toBe(true);
    expect(isSafeShellInput('/absolute/path/file.txt')).toBe(true);
    expect(isSafeShellInput('relative/path/file.txt')).toBe(true);
  });

  it('should allow spaces', () => {
    expect(isSafeShellInput('file name.txt')).toBe(true);
  });

  it('should reject command injection attempts', () => {
    expect(isSafeShellInput('file; rm -rf /')).toBe(false);
    expect(isSafeShellInput('file && malicious')).toBe(false);
    expect(isSafeShellInput('file | cat')).toBe(false);
    expect(isSafeShellInput('file$(command)')).toBe(false);
    expect(isSafeShellInput('file`command`')).toBe(false);
  });

  it('should reject special shell characters', () => {
    expect(isSafeShellInput('file*')).toBe(false);
    expect(isSafeShellInput('file?')).toBe(false);
    expect(isSafeShellInput('file>')).toBe(false);
    expect(isSafeShellInput('file<')).toBe(false);
    expect(isSafeShellInput('file&')).toBe(false);
    expect(isSafeShellInput("file'")).toBe(false);
    expect(isSafeShellInput('file"')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(isSafeShellInput('')).toBe(false);
  });
});

describe('safeShellArg', () => {
  it('should validate and escape safe inputs', () => {
    expect(safeShellArg('file.txt')).toBe("'file.txt'");
    expect(safeShellArg('my_file.txt')).toBe("'my_file.txt'");
  });

  it('should throw error for unsafe inputs by default', () => {
    expect(() => safeShellArg('file; rm -rf /')).toThrow(/Unsafe shell argument detected/);
    expect(() => safeShellArg('file && malicious')).toThrow(/Unsafe shell argument detected/);
  });

  it('should allow unsafe inputs when explicitly requested', () => {
    expect(safeShellArg('file; rm -rf /', true)).toBe("'file; rm -rf /'");
    expect(safeShellArg('file && malicious', true)).toBe("'file && malicious'");
  });

  it('should handle paths correctly', () => {
    expect(safeShellArg('/path/to/file.txt')).toBe("'/path/to/file.txt'");
    expect(safeShellArg('relative/path/file.txt')).toBe("'relative/path/file.txt'");
  });

  it('should handle files with spaces', () => {
    expect(safeShellArg('file name.txt')).toBe("'file name.txt'");
  });

  it('should escape single quotes even in safe mode', () => {
    // Single quotes are rejected by isSafeShellInput
    // but with allowUnsafe=true, it should still escape them
    expect(safeShellArg("file's.txt", true)).toBe("'file'\\''s.txt'");
  });

  it('should reject single quotes in strict mode', () => {
    // Single quotes are considered unsafe
    expect(() => safeShellArg("file's.txt")).toThrow(/Unsafe shell argument detected/);
  });
});
