import { describe, it, expect } from 'vitest';
import { filterFilesBySuffix } from './files.js';

describe('filterFilesBySuffix', () => {
  it('should filter out files with matching suffix patterns', () => {
    const files = [
      'lib/user.dart',
      'lib/user.g.dart',
      'lib/query.gql.dart',
      'lib/model.dart',
    ];
    const filtered = filterFilesBySuffix(files, ['.g.dart', '.gql.dart']);
    expect(filtered).toEqual(['lib/user.dart', 'lib/model.dart']);
  });

  it('should return all files when no suffix patterns provided', () => {
    const files = ['lib/user.dart', 'lib/user.g.dart', 'lib/query.gql.dart'];
    const filtered = filterFilesBySuffix(files, []);
    expect(filtered).toEqual(files);
  });

  it('should handle empty file list', () => {
    const files: string[] = [];
    const filtered = filterFilesBySuffix(files, ['.g.dart']);
    expect(filtered).toEqual([]);
  });

  it('should be case-sensitive', () => {
    const files = ['lib/User.G.DART', 'lib/user.g.dart', 'lib/model.dart'];
    const filtered = filterFilesBySuffix(files, ['.g.dart']);
    expect(filtered).toEqual(['lib/User.G.DART', 'lib/model.dart']);
  });

  it('should handle various file types', () => {
    const files = [
      'src/component.tsx',
      'src/component.test.tsx',
      'src/styles.css',
      'src/styles.module.css',
      'dist/bundle.js',
      'dist/bundle.min.js',
    ];
    const filtered = filterFilesBySuffix(files, [
      '.test.tsx',
      '.module.css',
      '.min.js',
    ]);
    expect(filtered).toEqual([
      'src/component.tsx',
      'src/styles.css',
      'dist/bundle.js',
    ]);
  });

  it('should handle files with multiple dots', () => {
    const files = [
      'file.name.with.dots.txt',
      'file.name.with.dots.backup.txt',
      'simple.txt',
    ];
    const filtered = filterFilesBySuffix(files, ['.backup.txt']);
    expect(filtered).toEqual(['file.name.with.dots.txt', 'simple.txt']);
  });

  it('should handle paths with directories', () => {
    const files = [
      'src/models/user.dart',
      'src/models/user.g.dart',
      'src/generated/schema.gql.dart',
      'test/user_test.dart',
    ];
    const filtered = filterFilesBySuffix(files, ['.g.dart', '.gql.dart']);
    expect(filtered).toEqual(['src/models/user.dart', 'test/user_test.dart']);
  });

  it('should only filter exact suffix matches', () => {
    const files = [
      'lib/user.dart',
      'lib/user.g.dart',
      'lib/userg.dart', // should not be filtered
      'lib/user.g.dart.backup', // should not be filtered
    ];
    const filtered = filterFilesBySuffix(files, ['.g.dart']);
    expect(filtered).toEqual([
      'lib/user.dart',
      'lib/userg.dart',
      'lib/user.g.dart.backup',
    ]);
  });

  it('should handle overlapping patterns', () => {
    const files = ['file.test.js', 'file.spec.js', 'file.js'];
    const filtered = filterFilesBySuffix(files, ['.test.js', '.spec.js']);
    expect(filtered).toEqual(['file.js']);
  });
});
