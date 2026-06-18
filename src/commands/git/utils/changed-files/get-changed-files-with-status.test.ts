import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { getChangedFilesWithStatus } from './get-changed-files-with-status.js';

function initRepo(): string {
  const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
  execSync('git init', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git checkout -b main', { cwd: tempDir, stdio: 'pipe' });
  return tempDir;
}

describe('getChangedFilesWithStatus', () => {
  it('should return null for a non-git directory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      expect(getChangedFilesWithStatus({ cwd: tempDir, type: 'staged' })).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should report staged files with their status', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      writeFileSync(join(tempDir, 'a.txt'), 'changed');
      writeFileSync(join(tempDir, 'b.txt'), 'new');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });

      const result = getChangedFilesWithStatus({ cwd: tempDir, type: 'staged' });
      expect(result).toEqual([
        { path: 'a.txt', status: 'M' },
        { path: 'b.txt', status: 'A' },
      ]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should report committed files relative to the base branch', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      writeFileSync(join(tempDir, 'c.txt'), 'new');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "add c"', { cwd: tempDir, stdio: 'pipe' });

      const result = getChangedFilesWithStatus({
        cwd: tempDir,
        type: 'committed',
        baseBranch: 'main',
      });
      expect(result).toEqual([{ path: 'c.txt', status: 'A' }]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return empty for committed changes on the base branch', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      const result = getChangedFilesWithStatus({
        cwd: tempDir,
        type: 'committed',
        baseBranch: 'main',
      });
      expect(result).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
