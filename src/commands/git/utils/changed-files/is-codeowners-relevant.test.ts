import { describe, it, expect } from 'vitest';
import { isCodeownersRelevant } from './is-codeowners-relevant.js';

describe('isCodeownersRelevant', () => {
  it('should be false when only existing files were modified', () => {
    expect(
      isCodeownersRelevant([
        { path: 'pubspec.yaml', status: 'M' },
        { path: 'lib/main.dart', status: 'M' },
      ])
    ).toBe(false);
  });

  it('should be true when a file was added', () => {
    expect(isCodeownersRelevant([{ path: 'lib/new.dart', status: 'A' }])).toBe(true);
  });

  it('should be true when a file was renamed', () => {
    expect(isCodeownersRelevant([{ path: 'lib/renamed.dart', status: 'R' }])).toBe(true);
  });

  it('should be true when a file was copied', () => {
    // A copy introduces a new path that may be unowned, like an add.
    expect(isCodeownersRelevant([{ path: 'lib/copied.dart', status: 'C' }])).toBe(true);
  });

  it('should be true when an OWNERSHIP file was modified', () => {
    expect(isCodeownersRelevant([{ path: 'lib/feature/OWNERSHIP', status: 'M' }])).toBe(true);
  });

  it('should be true when a CODEOWNERS file was modified', () => {
    expect(isCodeownersRelevant([{ path: '.github/CODEOWNERS', status: 'M' }])).toBe(true);
  });

  it('should be false for an empty change set', () => {
    expect(isCodeownersRelevant([])).toBe(false);
  });
});
