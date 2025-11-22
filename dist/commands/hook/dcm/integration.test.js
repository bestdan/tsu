import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdtempSync, rmSync, cpSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { isCommandInstalled } from '../../../utils/shell.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dcmFixtureDir = resolve(__dirname, '../../../__fixtures__/dart-app-with-dcm');
describe('DCM integration tests with analysis_options.yaml', () => {
    let tempDir;
    let corePackageDir;
    beforeEach(() => {
        tempDir = mkdtempSync(join(tmpdir(), 'dcm-test-'));
        cpSync(dcmFixtureDir, join(tempDir, 'dart-app-with-dcm'), {
            recursive: true,
        });
        corePackageDir = join(tempDir, 'dart-app-with-dcm', 'packages', 'core');
    });
    afterEach(() => {
        if (tempDir) {
            rmSync(tempDir, { recursive: true, force: true });
        }
    });
    it('should detect violations of prefer-trailing-comma rule from analysis_options.yaml', () => {
        if (!isCommandInstalled('dcm')) {
            console.log('Skipping DCM integration test: dcm not installed');
            return;
        }
        const configFile = join(corePackageDir, 'lib', 'config.dart');
        const configContent = readFileSync(configFile, 'utf-8');
        expect(configContent).toContain('this.debugMode\n  );');
        expect(configContent).toContain("'debugMode': debugMode\n    };");
        let analyzeError = null;
        try {
            execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
                cwd: corePackageDir,
                stdio: 'pipe',
                encoding: 'utf-8',
            });
        }
        catch (error) {
            analyzeError = error;
        }
        expect(analyzeError).not.toBeNull();
        if (analyzeError) {
            const output = analyzeError.stdout || analyzeError.stderr || '';
            expect(output.toLowerCase()).toMatch(/trailing.?comma|prefer-trailing-comma/);
        }
    });
    it('should fix violations using dcm fix with rules from analysis_options.yaml', () => {
        if (!isCommandInstalled('dcm')) {
            console.log('Skipping DCM integration test: dcm not installed');
            return;
        }
        const configFile = join(corePackageDir, 'lib', 'config.dart');
        const originalContent = readFileSync(configFile, 'utf-8');
        expect(originalContent).toContain('this.debugMode\n  );');
        expect(originalContent).toContain("'debugMode': debugMode\n    };");
        execSync(`dcm fix ${configFile}`, {
            cwd: corePackageDir,
            stdio: 'pipe',
        });
        const fixedContent = readFileSync(configFile, 'utf-8');
        expect(fixedContent).toContain('const Config(this.appName, this.version, this.debugMode);');
        expect(fixedContent).toContain("return {'appName': appName, 'version': version, 'debugMode': debugMode};");
        expect(fixedContent).toContain("map['debugMode'] as bool,\n    );");
        let analyzeError = null;
        try {
            execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
                cwd: corePackageDir,
                stdio: 'pipe',
            });
        }
        catch (error) {
            analyzeError = error;
        }
        expect(analyzeError).toBeNull();
    });
    it('should respect analysis_options.yaml rules hierarchy', () => {
        if (!isCommandInstalled('dcm')) {
            console.log('Skipping DCM integration test: dcm not installed');
            return;
        }
        const packageAnalysisOptions = join(corePackageDir, 'analysis_options.yaml');
        const packageOptions = readFileSync(packageAnalysisOptions, 'utf-8');
        expect(packageOptions).toContain('include: ../../analysis_options.yaml');
        const rootAnalysisOptions = join(tempDir, 'dart-app-with-dcm', 'analysis_options.yaml');
        const rootOptions = readFileSync(rootAnalysisOptions, 'utf-8');
        expect(rootOptions).toContain('prefer-trailing-comma');
        const configFile = join(corePackageDir, 'lib', 'config.dart');
        let analyzeError = null;
        try {
            execSync(`dcm analyze ${configFile} --fatal-style --fatal-warnings`, {
                cwd: corePackageDir,
                stdio: 'pipe',
            });
        }
        catch (error) {
            analyzeError = error;
        }
        expect(analyzeError).not.toBeNull();
    });
});
//# sourceMappingURL=integration.test.js.map