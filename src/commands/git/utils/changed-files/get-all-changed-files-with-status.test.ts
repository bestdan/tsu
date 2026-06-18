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

  it('should ignore untracked files in push mode', () => {
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      writeFileSync(join(tempDir, 'tracked.txt'), 'new');
      execSync('git add tracked.txt', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "add tracked"', { cwd: tempDir, stdio: 'pipe' });
      // Untracked working-tree clutter (e.g. generated files, scratch dirs)
      // must not influence what the pre-push hook considers changed.
      writeFileSync(join(tempDir, 'untracked.txt'), 'junk');

      const result = getAllChangedFilesWithStatus({ baseBranch: 'main' }, tempDir);
      expect(result).toEqual([{ path: 'tracked.txt', status: 'A' }]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should exclude a committed OWNERSHIP deletion (--diff-filter=ACMR)', () => {
    // Documents a known gap: removing an OWNERSHIP file can orphan a directory,
    // but the deletion is stripped by `--diff-filter=ACMR`, so it never reaches
    // isCodeownersRelevant and the codeowners check is skipped for that push.
    const tempDir = initRepo();
    try {
      writeFileSync(join(tempDir, 'OWNERSHIP'), 'team: x\n');
      writeFileSync(join(tempDir, 'a.txt'), 'a');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      execSync('git rm OWNERSHIP', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "remove ownership"', { cwd: tempDir, stdio: 'pipe' });

      const result = getAllChangedFilesWithStatus({ baseBranch: 'main' }, tempDir);
      expect(result).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  // The deletion above is silently dropped, so codeowners never re-validates a
  // directory whose OWNERSHIP file was removed. Closing this needs a detection
  // change (surface ownership-file deletions); see PR #193 review discussion.
  it.todo('should surface deleted OWNERSHIP/CODEOWNERS files so codeowners can re-validate');
});
