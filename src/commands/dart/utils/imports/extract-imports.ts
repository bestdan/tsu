import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Extracts import statements from a Dart file.
 * @param filePath - Path to the Dart file
 * @param packageRoot - Root directory of the Dart package
 * @returns Array of imported file paths (resolved where possible)
 */
export function extractImports(
  filePath: string,
  packageRoot: string
): string[] {
  if (!existsSync(filePath)) {
    return [];
  }

  const content = readFileSync(filePath, 'utf-8');
  const imports: string[] = [];

  // Match import statements: import 'path' or import "path"
  // Captures both single and double quotes
  const importRegex = /^\s*import\s+['"]([^'"]+)['"]/gm;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];

    // match[1] could be undefined in theory, skip if so
    if (!importPath) {
      continue;
    }

    // Skip dart: imports (SDK imports)
    if (importPath.startsWith('dart:')) {
      continue;
    }

    // Handle package: imports
    if (importPath.startsWith('package:')) {
      // Extract package name and path: package:package_name/path/to/file.dart
      const packageMatch = importPath.match(/^package:([^/]+)\/(.+)$/);
      if (packageMatch && packageMatch[1] && packageMatch[2]) {
        const packageName = packageMatch[1];
        const packagePath = packageMatch[2];

        // In Dart, package imports map to lib/ directory
        // package:features/account/foo.dart -> features/lib/account/foo.dart

        // 1. Try subdirectory package with lib (like features/lib/)
        const subPackageWithLib = resolve(
          packageRoot,
          packageName,
          'lib',
          packagePath
        );
        if (existsSync(subPackageWithLib)) {
          imports.push(`${packageName}/lib/${packagePath}`);
          continue;
        }

        // 2. Try same package with lib/ (for local package)
        const localWithLib = resolve(packageRoot, 'lib', packagePath);
        if (existsSync(localWithLib)) {
          imports.push(`lib/${packagePath}`);
          continue;
        }

        // 3. Try without lib/ for non-standard packages
        const subPackagePath = resolve(packageRoot, packageName, packagePath);
        if (existsSync(subPackagePath)) {
          imports.push(`${packageName}/${packagePath}`);
          continue;
        }
      }
    } else {
      // Relative import
      imports.push(importPath);
    }
  }

  return imports;
}
