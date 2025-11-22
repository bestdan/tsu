import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDcmAnalyzeOutput, dcmAnalyze } from './dcm-parse.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
describe('parseDcmAnalyzeOutput', () => {
    it('should extract file paths from valid DCM analyze output', () => {
        const json = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [
                { title: 'Total lint style issues', value: 3 },
                { title: 'Scanned folders', value: 1046 },
                { title: 'Scanned files', value: 2069 },
            ],
            analyzeResults: [
                {
                    path: 'lib/financial_security/screens/components/header.dart',
                    issues: [
                        {
                            id: 'member-ordering',
                            location: {
                                endColumn: 22,
                                endLine: 55,
                                startColumn: 3,
                                startLine: 55,
                                startOffset: 2303,
                            },
                            message: 'final-nullable-fields should be before constructors.',
                            effortInMinutes: 5,
                            documentation: 'https://dcm.dev/docs/rules/common/member-ordering',
                            severity: 'style',
                        },
                    ],
                },
                {
                    path: 'lib/another/file.dart',
                    issues: [],
                },
            ],
        });
        const result = parseDcmAnalyzeOutput(json);
        expect(result).toEqual([
            'lib/financial_security/screens/components/header.dart',
            'lib/another/file.dart',
        ]);
    });
    it('should return empty array for empty analyzeResults', () => {
        const json = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [],
        });
        const result = parseDcmAnalyzeOutput(json);
        expect(result).toEqual([]);
    });
    it('should return empty array for invalid JSON', () => {
        const result = parseDcmAnalyzeOutput('not valid json');
        expect(result).toEqual([]);
    });
    it('should return empty array for empty string', () => {
        const result = parseDcmAnalyzeOutput('');
        expect(result).toEqual([]);
    });
    it('should handle multiple files with issues', () => {
        const json = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [
                { path: 'file1.dart', issues: [{}] },
                { path: 'file2.dart', issues: [{}] },
                { path: 'file3.dart', issues: [] },
            ],
        });
        const result = parseDcmAnalyzeOutput(json);
        expect(result).toEqual(['file1.dart', 'file2.dart', 'file3.dart']);
    });
    it('should extract JSON from mixed output with human-readable text', () => {
        const mixedOutput = `✖ total lint style issues - 3
{"formatVersion":11,"timestamp":"2025-11-04 15:18:34.000","summary":[{"title":"Total lint style issues","value":3}],"analyzeResults":[{"path":"lib/config.dart","issues":[{"id":"prefer-trailing-comma"}]}]}`;
        const result = parseDcmAnalyzeOutput(mixedOutput);
        expect(result).toEqual(['lib/config.dart']);
    });
    it('should handle multiline mixed output', () => {
        const mixedOutput = `Some warning text
Another line
{"formatVersion":11,"timestamp":"2025-11-04 15:18:34.000","summary":[],"analyzeResults":[{"path":"lib/file1.dart","issues":[]},{"path":"lib/file2.dart","issues":[]}]}
Trailing text`;
        const result = parseDcmAnalyzeOutput(mixedOutput);
        expect(result).toEqual(['lib/file1.dart', 'lib/file2.dart']);
    });
    it('should parse actual DCM error output from fixture', () => {
        const fixtureContent = readFileSync(join(__dirname, '../__fixtures__/dcm-analyze-output.json'), 'utf-8');
        const result = parseDcmAnalyzeOutput(fixtureContent);
        expect(result).toEqual(['lib/config.dart']);
    });
    it('should return empty array when JSON.parse throws', () => {
        const invalidStructure = '{"wrong": "structure"}';
        const result = parseDcmAnalyzeOutput(invalidStructure);
        expect(result).toEqual([]);
    });
});
describe('dcmAnalyze', () => {
    it('has correct interface and types', () => {
        expect(typeof dcmAnalyze).toBe('function');
    });
    it('should return success when DCM finds no issues', () => {
        const mockOutput = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [],
        });
        const mockRunner = () => mockOutput;
        const result = dcmAnalyze({ cwd: '/test' }, mockRunner);
        expect(result.success).toBe(true);
        expect(result.filesWithIssues).toEqual([]);
        expect(result.rawOutput).toBe(mockOutput);
    });
    it('should handle DCM finding issues (non-zero exit but with JSON output)', () => {
        const mockOutput = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [
                { path: 'lib/file1.dart', issues: [{}] },
                { path: 'lib/file2.dart', issues: [] },
            ],
        });
        const mockRunner = () => {
            const error = new Error('DCM found issues');
            error.stdout = mockOutput;
            error.stderr = '';
            throw error;
        };
        const result = dcmAnalyze({ cwd: '/test' }, mockRunner);
        expect(result.success).toBe(false);
        expect(result.filesWithIssues).toEqual(['lib/file1.dart', 'lib/file2.dart']);
        expect(result.rawOutput).toBe(mockOutput);
    });
    it('should throw error on timeout', () => {
        const mockRunner = () => {
            const error = new Error('Timeout');
            error.code = 'ETIMEDOUT';
            throw error;
        };
        expect(() => dcmAnalyze({ cwd: '/test/pkg' }, mockRunner)).toThrow('DCM analyze timed out in /test/pkg after 7000ms');
    });
    it('should throw error on SIGTERM', () => {
        const mockRunner = () => {
            const error = new Error('Terminated');
            error.signal = 'SIGTERM';
            throw error;
        };
        expect(() => dcmAnalyze({ cwd: '/test/pkg' }, mockRunner)).toThrow('DCM analyze timed out in /test/pkg after 7000ms');
    });
    it('should throw error when DCM fails with no output', () => {
        const mockRunner = () => {
            const error = new Error('DCM failed');
            error.stdout = '';
            error.stderr = 'Command not found';
            throw error;
        };
        expect(() => dcmAnalyze({ cwd: '/test/pkg' }, mockRunner)).toThrow('DCM analyze failed in /test/pkg: Command not found');
    });
    it('should throw error when DCM fails with no stderr', () => {
        const mockRunner = () => {
            const error = new Error('DCM failed');
            error.stdout = '';
            error.stderr = '';
            throw error;
        };
        expect(() => dcmAnalyze({ cwd: '/test/pkg' }, mockRunner)).toThrow('DCM analyze failed in /test/pkg: No output from DCM');
    });
    it('should use cwd when no files provided', () => {
        const mockOutput = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [],
        });
        let calledWith;
        const mockRunner = (packageRoot) => {
            calledWith = packageRoot;
            return mockOutput;
        };
        dcmAnalyze({ cwd: '/test/package' }, mockRunner);
        expect(calledWith).toBe('/test/package');
    });
    it('should use cwd when empty files array provided', () => {
        const mockOutput = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [],
        });
        let calledWith;
        const mockRunner = (packageRoot) => {
            calledWith = packageRoot;
            return mockOutput;
        };
        dcmAnalyze({ cwd: '/test/package', files: [] }, mockRunner);
        expect(calledWith).toBe('/test/package');
    });
    it('should handle multiple package roots', () => {
        const mockOutput1 = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [{ path: 'lib/pkg1.dart', issues: [] }],
        });
        const mockOutput2 = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [{ path: 'lib/pkg2.dart', issues: [] }],
        });
        const calledRoots = [];
        const mockRunner = (packageRoot) => {
            calledRoots.push(packageRoot);
            return packageRoot.includes('pkg1') ? mockOutput1 : mockOutput2;
        };
        const result = dcmAnalyze({ cwd: '/test/monorepo' }, mockRunner);
        expect(result.success).toBe(true);
        expect(calledRoots.length).toBeGreaterThan(0);
    });
    it('should combine output from multiple packages with issues', () => {
        const mockOutput1 = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [{ path: 'lib/file1.dart', issues: [{}] }],
        });
        const mockOutput2 = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [{ path: 'lib/file2.dart', issues: [{}] }],
        });
        let callCount = 0;
        const mockRunner = () => {
            callCount++;
            const error = new Error('Issues found');
            error.stdout = callCount === 1 ? mockOutput1 : mockOutput2;
            error.stderr = '';
            throw error;
        };
        const result = dcmAnalyze({ cwd: '/test' }, mockRunner);
        expect(result.success).toBe(false);
        expect(result.filesWithIssues).toContain('lib/file1.dart');
    });
    it('should find package roots for provided files', () => {
        const mockOutput = JSON.stringify({
            formatVersion: 11,
            timestamp: '2025-11-04 14:46:10.000',
            summary: [],
            analyzeResults: [],
        });
        const mockRunner = () => mockOutput;
        const result = dcmAnalyze({
            cwd: '/test/monorepo',
            files: ['packages/app/lib/main.dart', 'packages/core/lib/config.dart'],
        }, mockRunner);
        expect(result.success).toBe(true);
    });
});
