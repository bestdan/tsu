import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { getFilesInRangeWithStatus } from './get-files-in-range-with-status.js';

function initRepo(): string {
  const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
  execSync('git init', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
  return tempDir;
}

describe('getFilesInRangeWithStatus', () => {
  it('should return null for a non-git directory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      const result = getFilesInRangeWithStatus({ range: 'HEAD~1..HEAD', cwd: tempDir });
      expect(result).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should report added and modified files with their status', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'file1.txt'), 'content1');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      writeFileSync(join(tempDir, 'file1.txt'), 'changed');
      writeFileSync(join(tempDir, 'file2.txt'), 'content2');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "second"', { cwd: tempDir, stdio: 'pipe' });

      const result = getFilesInRangeWithStatus({ range: 'HEAD~1..HEAD', cwd: tempDir });
      expect(result).toEqual([
        { path: 'file1.txt', status: 'M' },
        { path: 'file2.txt', status: 'A' },
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should report a renamed file with status R and the new path', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'old.txt'), 'a'.repeat(200));
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git mv old.txt new.txt', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "rename"', { cwd: tempDir, stdio: 'pipe' });

      const result = getFilesInRangeWithStatus({ range: 'HEAD~1..HEAD', cwd: tempDir });
      expect(result).toEqual([{ path: 'new.txt', status: 'R' }]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return null on an invalid range', () => {
    const tempDir = initRepo();
    try {
      const result = getFilesInRangeWithStatus({ range: 'invalid..range', cwd: tempDir });
      expect(result).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
