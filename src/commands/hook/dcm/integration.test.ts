import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isCommandInstalled } from '../../../utils/shell.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to our DCM test fixture
const dcmFixtureDir = resolve(
  __dirname,
  '../../../__fixtures__/dart-app-with-dcm'
);

describe('DCM integration tests with analysis_options.yaml', () => {
  let tempDir: string;
  let corePackageDir: string;

  beforeEach(() => {
    // Create a temporary directory and copy the fixture
    tempDir = mkdtempSync(join(tmpdir(), 'dcm-test-'));
    cpSync(dcmFixtureDir, join(tempDir, 'dart-app-with-dcm'), {
      recursive: true,
    });
    corePackageDir = join(tempDir, 'dart-app-with-dcm', 'packages', 'core');
  });

  afterEach(() => {
    // Clean up temp directory
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should detect violations of prefer-trailing-comma rule from analysis_options.yaml', () => {
    // Skip if DCM is not installed
    if (!isCommandInstalled('dcm')) {
      console.log('Skipping DCM integration test: dcm not installed');
      return;
    }

    // The config.dart file violates prefer-trailing-comma rule
    const configFile = join(corePackageDir, 'lib', 'config.dart');
    const configContent = readFileSync(configFile, 'utf-8');

    // Verify the file has violations (no trailing commas)
    expect(configContent).toContain('this.debugMode\n  );');
    expect(configContent).toContain("'debugMode': debugMode\n    };");

    // Run dcm analyze and expect it to fail
    let analyzeError = null;
    try {
      execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
        cwd: corePackageDir,
        stdio: 'pipe',
        encoding: 'utf-8',
      });
    } catch (error: any) {
      analyzeError = error;
    }

    // Should have found issues
    expect(analyzeError).not.toBeNull();
    if (analyzeError) {
      const output = analyzeError.stdout || analyzeError.stderr || '';
      // DCM should report prefer-trailing-comma violations
      expect(output.toLowerCase()).toMatch(
        /trailing.?comma|prefer-trailing-comma/
      );
    }
  });

  it('should fix violations using dcm fix with rules from analysis_options.yaml', () => {
    // Skip if DCM is not installed
    if (!isCommandInstalled('dcm')) {
      console.log('Skipping DCM integration test: dcm not installed');
      return;
    }

    // The config.dart file violates prefer-trailing-comma rule
    const configFile = join(corePackageDir, 'lib', 'config.dart');
    const originalContent = readFileSync(configFile, 'utf-8');

    // Verify original has violations (multi-line format without trailing commas)
    expect(originalContent).toContain('this.debugMode\n  );');
    expect(originalContent).toContain("'debugMode': debugMode\n    };");

    // Run dcm fix to apply trailing commas
    execSync(`dcm fix ${configFile}`, {
      cwd: corePackageDir,
      stdio: 'pipe',
    });

    // Read the fixed content
    const fixedContent = readFileSync(configFile, 'utf-8');

    // After fix, DCM reformats the code:
    // - The constructor is collapsed to a single line (no trailing comma needed for single-line)
    // - The toMap return is collapsed to a single line (no trailing comma needed for single-line)
    // - The factory constructor keeps multi-line format and adds trailing comma
    expect(fixedContent).toContain(
      'const Config(this.appName, this.version, this.debugMode);'
    );
    expect(fixedContent).toContain(
      "return {'appName': appName, 'version': version, 'debugMode': debugMode};"
    );
    expect(fixedContent).toContain("map['debugMode'] as bool,\n    );");

    // Verify dcm analyze now passes
    let analyzeError = null;
    try {
      execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
        cwd: corePackageDir,
        stdio: 'pipe',
      });
    } catch (error: any) {
      analyzeError = error;
    }

    // Should pass now
    expect(analyzeError).toBeNull();
  });

  it('should respect analysis_options.yaml rules hierarchy', () => {
    // Skip if DCM is not installed
    if (!isCommandInstalled('dcm')) {
      console.log('Skipping DCM integration test: dcm not installed');
      return;
    }

    // Verify that analysis_options.yaml exists at package level
    const packageAnalysisOptions = join(
      corePackageDir,
      'analysis_options.yaml'
    );
    const packageOptions = readFileSync(packageAnalysisOptions, 'utf-8');
    expect(packageOptions).toContain('include: ../../analysis_options.yaml');

    // Verify root analysis_options.yaml has the prefer-trailing-comma rule
    const rootAnalysisOptions = join(
      tempDir,
      'dart-app-with-dcm',
      'analysis_options.yaml'
    );
    const rootOptions = readFileSync(rootAnalysisOptions, 'utf-8');
    expect(rootOptions).toContain('prefer-trailing-comma');

    // Run dcm analyze on the entire core package to ensure it picks up the rules
    const configFile = join(corePackageDir, 'lib', 'config.dart');
    let analyzeError = null;
    try {
      execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
        cwd: corePackageDir,
        stdio: 'pipe',
      });
    } catch (error: any) {
      analyzeError = error;
    }

    // Should detect violations based on inherited rules
    expect(analyzeError).not.toBeNull();
  });
});
