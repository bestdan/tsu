import { describe, it, expect } from 'vitest';
import { parseDartAnalyzeOutput, dartAnalyze } from './dart-analyze-parse.js';

describe('parseDartAnalyzeOutput', () => {
  it('should parse single issue from dart analyze output', () => {
    const output = `Analyzing ....                         11.1s

   info • lib/account/screens/account_screen/account_screen.dart:102:16 • Use 'const' with the constructor to improve
          performance. Try adding the 'const' keyword to the constructor invocation. • prefer_const_constructors

1 issue found.`;

    const issues = parseDartAnalyzeOutput(output);

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      severity: 'info',
      filePath: 'lib/account/screens/account_screen/account_screen.dart',
      line: 102,
      column: 16,
      message: "Use 'const' with the constructor to improve\n          performance. Try adding the 'const' keyword to the constructor invocation.",
      code: 'prefer_const_constructors',
    });
  });

  it('should parse multiple issues from dart analyze output', () => {
    const output = `Analyzing ....                         5.2s

   info • lib/models/user.dart:10:5 • Prefer const constructors. • prefer_const_constructors
   warning • lib/services/api.dart:25:10 • Unused import. • unused_import
   error • lib/main.dart:50:20 • Undefined name 'nonExistent'. • undefined_identifier

3 issues found.`;

    const issues = parseDartAnalyzeOutput(output);

    expect(issues).toHaveLength(3);
    expect(issues[0]).toEqual({
      severity: 'info',
      filePath: 'lib/models/user.dart',
      line: 10,
      column: 5,
      message: 'Prefer const constructors.',
      code: 'prefer_const_constructors',
    });
    expect(issues[1]).toEqual({
      severity: 'warning',
      filePath: 'lib/services/api.dart',
      line: 25,
      column: 10,
      message: 'Unused import.',
      code: 'unused_import',
    });
    expect(issues[2]).toEqual({
      severity: 'error',
      filePath: 'lib/main.dart',
      line: 50,
      column: 20,
      message: "Undefined name 'nonExistent'.",
      code: 'undefined_identifier',
    });
  });

  it('should return empty array for clean output', () => {
    const output = `Analyzing ....                         3.5s

No issues found!`;

    const issues = parseDartAnalyzeOutput(output);
    expect(issues).toHaveLength(0);
  });

  it('should handle output with no issues', () => {
    const output = `Analyzing ....                         2.1s

0 issues found.`;

    const issues = parseDartAnalyzeOutput(output);
    expect(issues).toHaveLength(0);
  });

  it('should handle empty output', () => {
    const issues = parseDartAnalyzeOutput('');
    expect(issues).toHaveLength(0);
  });

  it('should handle multi-line messages', () => {
    const output = `Analyzing ....                         4.3s

   info • lib/widgets/button.dart:15:8 • This widget should be const for better performance.
          Consider making this widget immutable. • prefer_const_constructors

1 issue found.`;

    const issues = parseDartAnalyzeOutput(output);

    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('This widget should be const');
  });
});

describe('dartAnalyze', () => {
  it('should return success when no issues found', () => {
    const mockRunner = () => 'Analyzing ....\n\nNo issues found!';

    const result = dartAnalyze(
      { cwd: '/test/path' },
      mockRunner
    );

    expect(result.success).toBe(true);
    expect(result.filesWithIssues).toHaveLength(0);
    expect(result.issues).toHaveLength(0);
  });

  it('should detect issues and return failure', () => {
    const mockRunner = () => {
      const error: any = new Error('dart analyze failed');
      error.stdout = `Analyzing ....

   info • lib/main.dart:10:5 • Prefer const. • prefer_const_constructors

1 issue found.`;
      error.code = 1;
      throw error;
    };

    const result = dartAnalyze(
      { cwd: '/test/path' },
      mockRunner
    );

    expect(result.success).toBe(false);
    expect(result.filesWithIssues).toEqual(['lib/main.dart']);
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]?.code).toBe('prefer_const_constructors');
  });

  it('should handle multiple files with issues', () => {
    const mockRunner = () => {
      const error: any = new Error('dart analyze failed');
      error.stdout = `Analyzing ....

   info • lib/main.dart:10:5 • Message 1 • code1
   warning • lib/user.dart:20:10 • Message 2 • code2
   info • lib/main.dart:30:15 • Message 3 • code3

3 issues found.`;
      error.code = 1;
      throw error;
    };

    const result = dartAnalyze(
      { cwd: '/test/path' },
      mockRunner
    );

    expect(result.success).toBe(false);
    expect(result.filesWithIssues).toHaveLength(2);
    expect(result.filesWithIssues).toContain('lib/main.dart');
    expect(result.filesWithIssues).toContain('lib/user.dart');
    expect(result.issues).toHaveLength(3);
  });

  it('should throw error on timeout', () => {
    const mockRunner = () => {
      const error: any = new Error('Timeout');
      error.code = 'ETIMEDOUT';
      throw error;
    };

    expect(() => {
      dartAnalyze({ cwd: '/test/path' }, mockRunner);
    }).toThrow('dart analyze timed out');
  });

  it('should throw error when dart analyze fails without output', () => {
    const mockRunner = () => {
      const error: any = new Error('Failed');
      error.stdout = '';
      error.stderr = 'dart command not found';
      throw error;
    };

    expect(() => {
      dartAnalyze({ cwd: '/test/path' }, mockRunner);
    }).toThrow('dart analyze failed');
    expect(() => {
      dartAnalyze({ cwd: '/test/path' }, mockRunner);
    }).toThrow('dart command not found');
  });

  it('should use default timeout when not specified', () => {
    let timeoutUsed = 0;
    const mockRunner = (_packageRoot: string, timeout: number) => {
      timeoutUsed = timeout;
      return 'No issues found!';
    };

    dartAnalyze({ cwd: '/test/path' }, mockRunner);
    
    expect(timeoutUsed).toBe(20000);
  });

  it('should use specified timeout', () => {
    let timeoutUsed = 0;
    const mockRunner = (_packageRoot: string, timeout: number) => {
      timeoutUsed = timeout;
      return 'No issues found!';
    };

    dartAnalyze({ cwd: '/test/path', timeout: 30000 }, mockRunner);
    
    expect(timeoutUsed).toBe(30000);
  });
});
