import { describe, it, expect } from 'vitest';
import { parseGitStatusEntries, getNewlyChangedFiles } from './git-status.js';

describe('parseGitStatusEntries', () => {
  it('should return empty map for empty string', () => {
    expect(parseGitStatusEntries('')).toEqual(new Map());
  });

  it('should parse a single modified file', () => {
    const result = parseGitStatusEntries('M  lib/main.dart');
    expect(result).toEqual(new Map([['lib/main.dart', 'M ']]));
  });

  it('should parse multiple entries', () => {
    const status = 'M  lib/main.dart\n?? README.md\nA  src/new.ts';
    const result = parseGitStatusEntries(status);
    expect(result.size).toBe(3);
    expect(result.get('lib/main.dart')).toBe('M ');
    expect(result.get('README.md')).toBe('??');
    expect(result.get('src/new.ts')).toBe('A ');
  });

  it('should handle renames by keeping the destination path', () => {
    const result = parseGitStatusEntries('R  old.ts -> new.ts');
    expect(result).toEqual(new Map([['new.ts', 'R ']]));
  });

  it('should skip malformed lines', () => {
    const status = 'not a valid line\nM  lib/valid.dart';
    const result = parseGitStatusEntries(status);
    expect(result.size).toBe(1);
    expect(result.get('lib/valid.dart')).toBe('M ');
  });

  it('should trim trailing whitespace from lines', () => {
    const result = parseGitStatusEntries('M  lib/main.dart   \n');
    expect(result.size).toBe(1);
    expect(result.has('lib/main.dart')).toBe(true);
  });
});

describe('getNewlyChangedFiles', () => {
  it('should return empty array when statuses are identical', () => {
    const status = 'M  lib/main.dart';
    expect(getNewlyChangedFiles(status, status)).toEqual([]);
  });

  it('should detect new files in after snapshot', () => {
    const before = 'M  lib/main.dart';
    const after = 'M  lib/main.dart\nM  lib/new.dart';
    expect(getNewlyChangedFiles(before, after)).toEqual(['lib/new.dart']);
  });

  it('should detect state changes', () => {
    const before = '?? lib/main.dart';
    const after = 'A  lib/main.dart';
    expect(getNewlyChangedFiles(before, after)).toEqual(['lib/main.dart']);
  });

  it('should return empty array when both are empty', () => {
    expect(getNewlyChangedFiles('', '')).toEqual([]);
  });

  it('should not include files only in the before snapshot', () => {
    const before = 'M  lib/old.dart\nM  lib/main.dart';
    const after = 'M  lib/main.dart';
    expect(getNewlyChangedFiles(before, after)).toEqual([]);
  });
});
