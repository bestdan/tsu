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
              message:
                'final-nullable-fields should be before constructors.',
              effortInMinutes: 5,
              documentation:
                'https://dcm.dev/docs/rules/common/member-ordering',
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
    // DCM outputs human-readable text before JSON
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
    const fixtureContent = readFileSync(
      join(__dirname, '../__fixtures__/errors.json'),
      'utf-8'
    );

    const result = parseDcmAnalyzeOutput(fixtureContent);
    expect(result).toEqual(['lib/config.dart']);
  });
});

describe('callAndParseDcm', () => {
  it('has correct interface and types', () => {
    // Since the implementation is marked with v8 ignore and requires
    // external DCM tool, we just verify the function exists and has
    // the correct interface
    expect(typeof dcmAnalyze).toBe('function');
  });
});
