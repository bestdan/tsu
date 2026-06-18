import { describe, it, expect } from 'vitest';
import { mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';
import { getAllChangedFilesWithStatus } from './get-all-changed-files-with-status.js';

function initRepo(): string {
  const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
  execSync('git init', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git config user.name "Test User"', { cwd: tempDir, stdio: 'pipe' });
  execSync('git checkout -b main', { cwd: tempDir, stdio: 'pipe' });
  return tempDir;
}

describe('getAllChangedFilesWithStatus', () => {
  it('should default to files-to-push with status', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      writeFileSync(join(tempDir, 'b.txt'), 'new');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "add b"', { cwd: tempDir, stdio: 'pipe' });

      const result = getAllChangedFilesWithStatus({ baseBranch: 'main' }, tempDir);
      expect(result).toEqual([{ path: 'b.txt', status: 'A' }]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return staged files with status when staged is requested', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      writeFileSync(join(tempDir, 'b.txt'), 'new');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });

      const result = getAllChangedFilesWithStatus({ staged: true }, tempDir);
      expect(result).toEqual([{ path: 'b.txt', status: 'A' }]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should combine and dedupe by path when all is requested', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      // committed change
      writeFileSync(join(tempDir, 'committed.txt'), 'c');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "committed"', { cwd: tempDir, stdio: 'pipe' });
      // staged change (new file) + unstaged change (modify tracked file)
      writeFileSync(join(tempDir, 'staged.txt'), 's');
      execSync('git add staged.txt', { cwd: tempDir, stdio: 'pipe' });
      writeFileSync(join(tempDir, 'a.txt'), 'modified');

      const result = getAllChangedFilesWithStatus({ all: true, baseBranch: 'main' }, tempDir);
      const paths = result.map((e) => e.path).sort();
      expect(paths).toEqual(['a.txt', 'committed.txt', 'staged.txt']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
