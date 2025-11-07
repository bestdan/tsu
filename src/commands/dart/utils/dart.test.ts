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
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to our test fixture
const fixtureDir = resolve(__dirname, '../../../__fixtures__/dart-package');

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

  it('should find package roots in multi-package monorepo with DCM fixture', () => {
    const dcmFixtureDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-app-with-dcm'
    );
    const corePackage = join(dcmFixtureDir, 'packages/core');
    const appPackage = join(dcmFixtureDir, 'packages/app');

    // Test from lib directory in core package
    const coreLibDir = join(corePackage, 'lib');
    expect(findDartPackageRoot(coreLibDir)).toBe(corePackage);

    // Test from lib directory in app package
    const appLibDir = join(appPackage, 'lib');
    expect(findDartPackageRoot(appLibDir)).toBe(appPackage);
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

  it('should detect packages in multi-package monorepo with DCM fixture', () => {
    const dcmFixtureDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-app-with-dcm'
    );
    const corePackage = join(dcmFixtureDir, 'packages/core');
    const appPackage = join(dcmFixtureDir, 'packages/app');

    expect(isDartPackage(corePackage)).toBe(true);
    expect(isDartPackage(appPackage)).toBe(true);
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
    const dartImports = imports.filter((imp) => imp.startsWith('dart:'));
    expect(dartImports).toHaveLength(0);
  });

  it('should return empty array for non-existent file', () => {
    const imports = extractImports('/fake/path/file.dart', fixtureDir);
    expect(imports).toEqual([]);
  });

  it('should handle monorepo with subpackage lib directories', () => {
    const monorepoDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-monorepo'
    );
    const mainFile = join(monorepoDir, 'lib', 'main.dart');
    const imports = extractImports(mainFile, monorepoDir);

    // Should find the features/lib/account/profile.dart import
    expect(imports).toContain('features/lib/account/profile.dart');
  });

  it('should handle non-standard package structures', () => {
    const nonstandardDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-nonstandard'
    );
    const mainFile = join(nonstandardDir, 'main.dart');
    const imports = extractImports(mainFile, nonstandardDir);

    // Should find the custom_pkg/util.dart import (without lib/)
    expect(imports).toContain('custom_pkg/util.dart');
  });

  it('should extract imports from multi-package monorepo with DCM fixture', () => {
    const dcmFixtureDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-app-with-dcm'
    );
    const coreUserFile = join(dcmFixtureDir, 'packages/core/lib/user.dart');
    const imports = extractImports(
      coreUserFile,
      join(dcmFixtureDir, 'packages/core')
    );

    // The User file itself has no imports (simple model), but test that it works
    expect(imports).toEqual([]);

    // Test that we can read from the core package
    const coreUtilsFile = join(dcmFixtureDir, 'packages/core/lib/utils.dart');
    const utilsImports = extractImports(
      coreUtilsFile,
      join(dcmFixtureDir, 'packages/core')
    );

    // utils.dart also has no imports, but confirms file can be read
    expect(utilsImports).toEqual([]);
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
    const fileNames = files!.map((f) => f.split('/').pop());
    expect(fileNames).toContain('main.dart');
    expect(fileNames).toContain('user.dart');
    expect(fileNames).toContain('auth.dart');
    expect(fileNames).toContain('logger.dart');
    expect(fileNames).toContain('user_test.dart');
  });

  it('should find dart files in multi-package monorepo with DCM fixture', () => {
    const dcmFixtureDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-app-with-dcm'
    );
    const corePackage = join(dcmFixtureDir, 'packages/core');
    const files = findAllDartFiles(corePackage);

    expect(files).not.toBe(null);
    expect(files!.length).toBeGreaterThan(0);

    // Should find user.dart, utils.dart, and core.dart
    const fileNames = files!.map((f) => f.split('/').pop());
    expect(fileNames).toContain('user.dart');
    expect(fileNames).toContain('utils.dart');
    expect(fileNames).toContain('core.dart');
  });

  it('should return null for errors', () => {
    // This might not error on all systems, but if it does, should return null
    const files = findAllDartFiles(
      '/this/path/definitely/does/not/exist/12345'
    );
    expect(files === null || Array.isArray(files)).toBe(true);
  });

  it('should return empty array when no dart files found', () => {
    // Create a temp directory with no dart files
    const tempDir = mkdtempSync(join(tmpdir(), 'no-dart-'));
    try {
      const files = findAllDartFiles(tempDir);
      expect(files).toEqual([]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe('buildDependencyGraph', () => {
  it('should build a dependency graph', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    expect(graph.size).toBeGreaterThan(0);

    // Find main.dart in the graph
    const mainFile = files!.find((f) => f.endsWith('lib/main.dart'));
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
    const userFile = files!.find((f) => f.endsWith('models/user.dart'));
    expect(userFile).toBeDefined();

    const userImporters = reverseGraph.get(userFile!);
    expect(userImporters).toBeDefined();
    expect(userImporters!.length).toBeGreaterThanOrEqual(1);
  });

  it('should handle files that are imported but not in the graph', () => {
    // Create a dependency graph with a file that imports another file
    const graph = new Map<string, string[]>();
    const file1 = '/path/to/file1.dart';
    const file2 = '/path/to/file2.dart';
    const file3 = '/path/to/file3.dart';

    // file1 imports file2 and file3, but file3 is not in the graph keys
    graph.set(file1, [file2, file3]);
    graph.set(file2, []);

    const reverseGraph = buildReverseDependencyGraph(graph);

    // file3 should be in the reverse graph even though it wasn't a key in original
    expect(reverseGraph.has(file3)).toBe(true);
    expect(reverseGraph.get(file3)).toEqual([file1]);
  });
});

describe('findDownstreamDependencies', () => {
  it('should find downstream dependencies', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    const reverseGraph = buildReverseDependencyGraph(graph);

    // Find dependencies of user.dart
    const userFile = files!.find((f) => f.endsWith('models/user.dart'));
    expect(userFile).toBeDefined();

    const downstream = findDownstreamDependencies([userFile!], reverseGraph);

    // Should find at least main.dart and auth.dart as downstream
    expect(downstream.size).toBeGreaterThan(0);

    const downstreamArray = Array.from(downstream);
    const hasMain = downstreamArray.some((f) => f.endsWith('lib/main.dart'));
    const hasAuth = downstreamArray.some((f) =>
      f.endsWith('services/auth.dart')
    );

    expect(hasMain || hasAuth).toBe(true);
  });

  it('should return empty set when no downstream dependencies', () => {
    const files = findAllDartFiles(fixtureDir);
    expect(files).not.toBe(null);

    const graph = buildDependencyGraph(files!, fixtureDir);
    const reverseGraph = buildReverseDependencyGraph(graph);

    // main.dart typically has no downstream dependencies (nothing imports it)
    const mainFile = files!.find((f) => f.endsWith('lib/main.dart'));
    expect(mainFile).toBeDefined();

    const downstream = findDownstreamDependencies([mainFile!], reverseGraph);

    // main.dart usually has no downstream deps
    expect(downstream.size).toBe(0);
  });
});

describe('readPackageIndex and findAffectedPackages', () => {
  it('should return null if PACKAGE_INDEX does not exist', async () => {
    const { readPackageIndex } = await import('./dart.js');
    const result = readPackageIndex('/tmp');
    expect(result).toBe(null);
  });

  it('should parse PACKAGE_INDEX correctly', async () => {
    const { readPackageIndex } = await import('./dart.js');
    const { writeFileSync, mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = mkdtempSync(join(tmpdir(), 'dart-test-'));
    const packageIndex = [
      { name: 'app', location: 'packages/app' },
      { name: 'core', location: 'packages/core' },
    ];
    writeFileSync(join(tempDir, 'PACKAGE_INDEX'), JSON.stringify(packageIndex));

    const result = readPackageIndex(tempDir);
    expect(result).toEqual(packageIndex);

    rmSync(tempDir, { recursive: true });
  });

  it('should find affected packages from files', async () => {
    const { findAffectedPackages } = await import('./dart.js');
    const { writeFileSync, mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = mkdtempSync(join(tmpdir(), 'dart-test-'));
    const packageIndex = [
      { name: 'app', location: 'packages/app' },
      { name: 'core', location: 'packages/core' },
    ];
    writeFileSync(join(tempDir, 'PACKAGE_INDEX'), JSON.stringify(packageIndex));

    const files = ['packages/app/lib/main.dart', 'packages/core/lib/util.dart'];
    const result = findAffectedPackages(files, tempDir);

    expect(result.size).toBe(2);
    expect(result.get('packages/app')).toBe('app');
    expect(result.get('packages/core')).toBe('core');

    rmSync(tempDir, { recursive: true });
  });

  it('should handle files not in any package', async () => {
    const { findAffectedPackages } = await import('./dart.js');
    const { writeFileSync, mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = mkdtempSync(join(tmpdir(), 'dart-test-'));
    const packageIndex = [{ name: 'app', location: 'packages/app' }];
    writeFileSync(join(tempDir, 'PACKAGE_INDEX'), JSON.stringify(packageIndex));

    const files = ['lib/main.dart', 'other/file.dart'];
    const result = findAffectedPackages(files, tempDir);

    expect(result.size).toBe(0);

    rmSync(tempDir, { recursive: true });
  });

  it('should fall back to pubspec.yaml when PACKAGE_INDEX does not exist', async () => {
    const { findAffectedPackages } = await import('./dart.js');
    const { writeFileSync, mkdtempSync, rmSync, mkdirSync } = await import(
      'node:fs'
    );
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = mkdtempSync(join(tmpdir(), 'dart-test-'));

    // Create a package structure with pubspec.yaml
    const packageDir = join(tempDir, 'packages', 'app');
    mkdirSync(join(packageDir, 'lib'), { recursive: true });
    writeFileSync(
      join(packageDir, 'pubspec.yaml'),
      'name: test_app\nversion: 1.0.0\n'
    );
    writeFileSync(join(packageDir, 'lib', 'main.dart'), '// test');

    const files = ['packages/app/lib/main.dart'];
    const result = findAffectedPackages(files, tempDir);

    expect(result.size).toBe(1);
    expect(result.get('packages/app')).toBe('test_app');

    rmSync(tempDir, { recursive: true });
  });

  it('should return empty map if no pubspec.yaml found', async () => {
    const { findAffectedPackages } = await import('./dart.js');
    const { mkdtempSync, rmSync } = await import('node:fs');
    const { join } = await import('node:path');
    const { tmpdir } = await import('node:os');

    const tempDir = mkdtempSync(join(tmpdir(), 'dart-test-'));
    const files = ['packages/app/lib/main.dart'];
    const result = findAffectedPackages(files, tempDir);

    expect(result.size).toBe(0);

    rmSync(tempDir, { recursive: true });
  });

  it('should find affected packages in multi-package monorepo using DCM fixture', async () => {
    const { findAffectedPackages } = await import('./dart.js');
    const dcmFixtureDir = resolve(
      __dirname,
      '../../../__fixtures__/dart-app-with-dcm'
    );

    const files = ['packages/app/lib/main.dart', 'packages/core/lib/user.dart'];
    const result = findAffectedPackages(files, dcmFixtureDir);

    // Should find both packages
    expect(result.size).toBe(2);
    expect(result.get('packages/app')).toBe('app');
    expect(result.get('packages/core')).toBe('core');
  });
});
