import { describe, it, expect } from 'vitest';
import {
  isGitRepo,
  getGitRoot,
  getChangedFiles,
  getCurrentBranch,
} from './git.js';
import { mkdtempSync, rmSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

describe('isGitRepo', () => {
  it('should return true when in a git repository', () => {
    // Test in the current project directory (which is a git repo based on env info)
    const result = isGitRepo(process.cwd());
    expect(result).toBe(true);
  });

  it('should return false when not in a git repository', () => {
    // Create a temporary directory that's not a git repo
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      const result = isGitRepo(tempDir);
      expect(result).toBe(false);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return false for non-existent directory', () => {
    const result = isGitRepo('/this/path/does/not/exist/hopefully');
    expect(result).toBe(false);
  });

  it('should use current directory when no argument provided', () => {
    const result = isGitRepo();
    // Should work same as passing process.cwd()
    expect(typeof result).toBe('boolean');
  });
});

describe('getGitRoot', () => {
  it('should return the git root path when in a repository', () => {
    const result = getGitRoot(process.cwd());
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
    // The result should be an absolute path
    if (result) {
      expect(result.startsWith('/')).toBe(true);
    }
  });

  it('should return null when not in a git repository', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      const result = getGitRoot(tempDir);
      expect(result).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return null for non-existent directory', () => {
    const result = getGitRoot('/this/path/does/not/exist/hopefully');
    expect(result).toBeNull();
  });

  it('should return same root for subdirectories in a repo', () => {
    // Create a temp git repo with subdirectories
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      const subDir = join(tempDir, 'subdir', 'nested');
      execSync(`mkdir -p "${subDir}"`, { stdio: 'pipe' });

      const rootFromRoot = getGitRoot(tempDir);
      const rootFromSub = getGitRoot(subDir);

      expect(rootFromRoot).toBe(rootFromSub);
      expect(rootFromRoot).toBe(tempDir);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('getCurrentBranch', () => {
  it('should return null for non-git directory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      const branch = getCurrentBranch(tempDir);
      expect(branch).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return branch name for a git repo', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Create initial commit
      writeFileSync(join(tempDir, 'test.txt'), 'test');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      const branch = getCurrentBranch(tempDir);
      expect(branch).toBeTruthy();
      // Could be 'main' or 'master' depending on git config
      expect(['main', 'master']).toContain(branch);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('getChangedFiles', () => {
  it('should return null for non-git directory', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'not-git-'));
    try {
      const files = getChangedFiles({ cwd: tempDir });
      expect(files).toBeNull();
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return empty array when on base branch', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git checkout -b main', { cwd: tempDir, stdio: 'pipe' });

      // Create initial commit
      writeFileSync(join(tempDir, 'test.txt'), 'test');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      const files = getChangedFiles({ cwd: tempDir, baseBranch: 'main' });
      expect(files).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return empty array when base branch does not exist', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Create initial commit
      writeFileSync(join(tempDir, 'test.txt'), 'test');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      const files = getChangedFiles({
        cwd: tempDir,
        baseBranch: 'nonexistent',
      });
      expect(files).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return committed changes compared to base branch', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git checkout -b main', { cwd: tempDir, stdio: 'pipe' });

      // Create initial commit on main
      writeFileSync(join(tempDir, 'file1.txt'), 'content1');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // Create feature branch
      execSync('git checkout -b feature', { cwd: tempDir, stdio: 'pipe' });
      writeFileSync(join(tempDir, 'file2.txt'), 'content2');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "add file2"', { cwd: tempDir, stdio: 'pipe' });

      const files = getChangedFiles({ cwd: tempDir, baseBranch: 'main' });
      expect(files).toEqual(['file2.txt']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return staged changes', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Create initial commit
      writeFileSync(join(tempDir, 'file1.txt'), 'content1');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // Stage a new file
      writeFileSync(join(tempDir, 'file2.txt'), 'content2');
      execSync('git add file2.txt', { cwd: tempDir, stdio: 'pipe' });

      const files = getChangedFiles({ cwd: tempDir, type: 'staged' });
      expect(files).toEqual(['file2.txt']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should return unstaged changes', () => {
    const tempDir = realpathSync(mkdtempSync(join(tmpdir(), 'git-test-')));
    try {
      execSync('git init', { cwd: tempDir, stdio: 'pipe' });
      execSync('git config user.email "test@test.com"', {
        cwd: tempDir,
        stdio: 'pipe',
      });
      execSync('git config user.name "Test User"', {
        cwd: tempDir,
        stdio: 'pipe',
      });

      // Create initial commit
      writeFileSync(join(tempDir, 'file1.txt'), 'content1');
      execSync('git add .', { cwd: tempDir, stdio: 'pipe' });
      execSync('git commit -m "initial"', { cwd: tempDir, stdio: 'pipe' });

      // Modify file without staging
      writeFileSync(join(tempDir, 'file1.txt'), 'modified content');

      const files = getChangedFiles({ cwd: tempDir, type: 'unstaged' });
      expect(files).toEqual(['file1.txt']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
