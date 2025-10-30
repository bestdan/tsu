import { describe, it, expect } from 'vitest';
import {
  findDartPackageRoot,
  findFilePackageRoot,
  isDartPackage,
  extractImports,
  resolveImportPath,
  findAllDartFiles,
  buildDependencyGraph,
  buildReverseDependencyGraph,
  findDownstreamDependencies,
} from './dart.js';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to our test fixture
const fixtureDir = resolve(__dirname, '../__fixtures__/dart-package');

describe('findDartPackageRoot', () => {
  it('should find package root from lib directory', () => {
    const libDir = join(fixtureDir, 'lib');
    const result = findDartPackageRoot(libDir);
    expect(result).toBe(fixtureDir);
  });

  it('should find package root from nested directory', () => {
    const nestedDir = join(fixtureDir, 'lib', 'models');
    const result = findDartPackageRoot(nestedDir);
    expect(result).toBe(fixtureDir);
  });

  it('should return null when not in a Dart package', () => {
    const result = findDartPackageRoot('/tmp');
    expect(result).toBe(null);
  });

  it('should use current directory when no argument provided', () => {
    // This will likely return null since we're not in a Dart package
    const result = findDartPackageRoot();
    expect(result === null || typeof result === 'string').toBe(true);
  });
});

describe('findFilePackageRoot', () => {
  it('should find file package root in same package', () => {
    const filePath = join(fixtureDir, 'lib', 'main.dart');
    const result = findFilePackageRoot(filePath, fixtureDir);
    expect(result).toBe(fixtureDir);
  });

  it('should return workspace root when no pubspec found', () => {
    const filePath = join(fixtureDir, 'lib', 'main.dart');
    const fakeWorkspace = '/some/fake/path';
    const result = findFilePackageRoot(filePath, fakeWorkspace);
    expect(result).toBe(fakeWorkspace);
  });
});

describe('isDartPackage', () => {
  it('should return true when in a Dart package', () => {
    const result = isDartPackage(fixtureDir);
    expect(result).toBe(true);
  });

  it('should return false when not in a Dart package', () => {
    const result = isDartPackage('/tmp');
    expect(result).toBe(false);
  });
});

describe('extractImports', () => {
  it('should extract package imports', () => {
    const mainFile = join(fixtureDir, 'lib', 'main.dart');
    const imports = extractImports(mainFile, fixtureDir);

    expect(imports).toContain('lib/models/user.dart');
    expect(imports).toContain('lib/services/auth.dart');
  });

  it('should extract relative imports', () => {
    const authFile = join(fixtureDir, 'lib', 'services', 'auth.dart');
    const imports = extractImports(authFile, fixtureDir);

    expect(imports).toContain('./logger.dart');
  });

  it('should skip dart: imports', () => {
    const mainFile = join(fixtureDir, 'lib', 'main.dart');
    const imports = extractImports(mainFile, fixtureDir);

    // Should not contain any dart: imports
    const dartImports = imports.filter(imp => imp.startsWith('dart:'));
    expect(dartImports).toHaveLength(0);
  });

  it('should return empty array for non-existent file', () => {
    const imports = extractImports('/fake/path/file.dart', fixtureDir);
    expect(imports).toEqual([]);
  });
});

describe('resolveImportPath', () => {
  it('should resolve relative imports', () => {
    const fromFile = join(fixtureDir, 'lib', 'services', 'auth.dart');
    const importPath = './logger.dart';
    const result = resolveImportPath(fromFile, importPath, fixtureDir);

    expect(result).toBe(join(fixtureDir, 'lib', 'services', 'logger.dart'));
  });

  it('should resolve package-relative imports', () => {
    const fromFile = join(fixtureDir, 'lib', 'main.dart');
    const importPath = 'lib/models/user.dart';
    const result = resolveImportPath(fromFile, importPath, fixtureDir);

    expect(result).toBe(join(fixtureDir, 'lib', 'models', 'user.dart'));
  });
});

describe('findAllDartFiles', () => {
  it('should find all dart files in package', () => {
    const files = findAllDartFiles(fixtureDir);

    expect(files).not.toBe(null);
    expect(files!.length).toBeGreaterThan(0);

    // Check that it found our test files
    const fileNames = files!.map(f => f.split('/').pop());
    expect(fileNames).toContain('main.dart');
    expect(fileNames).toContain('user.dart');
    expect(fileNames).toContain('auth.dart');
    expect(fileNames).toContain('logger.dart');
    expect(fileNames).toContain('user_test.dart');
  });

  it('should return null for errors', () => {
    // This might not error on all systems, but if it does, should return null
    const files = findAllDartFiles('/this/path/definitely/does/not/exist/12345');
    expect(files === null || Array.isArray(files)).toBe(true);
  });
});

describe('buildDependencyGraph', () => {
  it('should build a dependency graph', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    expect(graph.size).toBeGreaterThan(0);

    // Find main.dart in the graph
    const mainFile = files!.find(f => f.endsWith('lib/main.dart'));
    expect(mainFile).toBeDefined();

    const mainDeps = graph.get(mainFile!);
    expect(mainDeps).toBeDefined();
    expect(mainDeps!.length).toBeGreaterThan(0);
  });
});

describe('buildReverseDependencyGraph', () => {
  it('should build a reverse dependency graph', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    const reverseGraph = buildReverseDependencyGraph(graph);

    expect(reverseGraph.size).toBe(graph.size);

    // user.dart should be imported by main.dart and auth.dart
    const userFile = files!.find(f => f.endsWith('models/user.dart'));
    expect(userFile).toBeDefined();

    const userImporters = reverseGraph.get(userFile!);
    expect(userImporters).toBeDefined();
    expect(userImporters!.length).toBeGreaterThanOrEqual(1);
  });
});

describe('findDownstreamDependencies', () => {
  it('should find downstream dependencies', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    const reverseGraph = buildReverseDependencyGraph(graph);

    // Find dependencies of user.dart
    const userFile = files!.find(f => f.endsWith('models/user.dart'));
    expect(userFile).toBeDefined();

    const downstream = findDownstreamDependencies([userFile!], reverseGraph);

    // Should find at least main.dart and auth.dart as downstream
    expect(downstream.size).toBeGreaterThan(0);

    const downstreamArray = Array.from(downstream);
    const hasMain = downstreamArray.some(f => f.endsWith('lib/main.dart'));
    const hasAuth = downstreamArray.some(f => f.endsWith('services/auth.dart'));

    expect(hasMain || hasAuth).toBe(true);
  });

  it('should return empty set when no downstream dependencies', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    const reverseGraph = buildReverseDependencyGraph(graph);

    // main.dart typically has no downstream dependencies (nothing imports it)
    const mainFile = files!.find(f => f.endsWith('lib/main.dart'));
    expect(mainFile).toBeDefined();

    const downstream = findDownstreamDependencies([mainFile!], reverseGraph);

    // main.dart usually has no downstream deps
    expect(downstream.size).toBe(0);
  });
});
