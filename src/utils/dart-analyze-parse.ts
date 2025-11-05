import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { findDartPackageRoot } from '../commands/dart/utils/dart.js';

export interface DartAnalyzeIssue {
  severity: string;
  filePath: string;
  line: number;
  column: number;
  message: string;
  code: string;
}

export function parseDartAnalyzeOutput(output: string): DartAnalyzeIssue[] {
  const issues: DartAnalyzeIssue[] = [];
  
  // Match pattern: severity • filepath:line:column • message • code
  // Example:    info • lib/account/screens/account_screen/account_screen.dart:102:16 • Use 'const' with the constructor...
  const issuePattern = /^\s*(info|warning|error)\s+•\s+([^:]+):(\d+):(\d+)\s+•\s+([^•]+)\s+•\s+(\S+)/gm;
  
  let match;
  while ((match = issuePattern.exec(output)) !== null) {
    // TypeScript regex match guarantees these exist due to the pattern
    const severity = match[1];
    const filePath = match[2];
    const line = match[3];
    const column = match[4];
    const message = match[5];
    const code = match[6];

    if (severity && filePath && line && column && message && code) {
      issues.push({
        severity: severity.trim(),
        filePath: filePath.trim(),
        line: parseInt(line, 10),
        column: parseInt(column, 10),
        message: message.trim(),
        code: code.trim(),
      });
    }
  }
  
  return issues;
}

export interface CallAndParseDartAnalyzeOptions {
  cwd: string;
  timeout?: number;
  files?: string[];
}

export interface CallAndParseDartAnalyzeResult {
  success: boolean;
  filesWithIssues: string[];
  issues: DartAnalyzeIssue[];
  rawOutput?: string;
}

/**
 * Runs dart analyze for a single package root.
 * Separated for easier testing and to avoid scattering v8 ignore comments.
 */
/* v8 ignore next -- @preserve */
function runDartAnalyzeForPackage(packageRoot: string, timeout: number): string {
  return execSync(
    'dart analyze . --fatal-infos --fatal-warnings',
    {
      cwd: packageRoot,
      stdio: 'pipe',
      timeout,
      encoding: 'utf-8',
    }
  );
}

interface DartAnalyzeRunResult {
  success: boolean;
  output: string;
  issues: DartAnalyzeIssue[];
}

/**
 * Processes error from dart analyze execution and extracts results.
 * Distinguishes between timeout/execution errors and dart analyze finding issues.
 */
function processDartAnalyzeError(
  error: unknown,
  packageRoot: string,
  timeout: number
): DartAnalyzeRunResult {
  const err = error as {
    code?: string;
    signal?: string;
    stdout?: Buffer | string;
    stderr?: Buffer | string;
  };

  // Distinguish between timeout/execution errors and dart analyze finding issues
  if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
    throw new Error(`dart analyze timed out in ${packageRoot} after ${timeout}ms`);
  }

  // If dart analyze ran but found issues, stdout will have the report
  const stdout = err.stdout?.toString() || '';
  const stderr = err.stderr?.toString() || '';

  if (stdout.length > 0) {
    // dart analyze found issues (exit code non-zero but produced output)
    const issues = parseDartAnalyzeOutput(stdout);
    return {
      success: false,
      output: stdout,
      issues,
    };
  }

  // dart analyze failed to run properly - no output
  const errorMsg = stderr.length > 0 ? stderr : 'No output from dart analyze';
  throw new Error(`dart analyze failed in ${packageRoot}: ${errorMsg}`);
}

export function dartAnalyze(
  options: CallAndParseDartAnalyzeOptions,
  // Allow dependency injection for testing
  dartAnalyzeRunner: (packageRoot: string, timeout: number) => string = runDartAnalyzeForPackage
): CallAndParseDartAnalyzeResult {
  const { cwd, timeout = 20000, files } = options;

  // Find unique package roots for all the files
  const packageRoots = new Set<string>();

  if (files && files.length > 0) {
    for (const file of files) {
      const absolutePath = resolve(cwd, file);
      const packageRoot = findDartPackageRoot(dirname(absolutePath));
      if (packageRoot) {
        packageRoots.add(packageRoot);
      }
    }
  }

  if (packageRoots.size === 0) {
    // No files provided or no package roots found, use cwd
    packageRoots.add(cwd);
  }

  // Run dart analyze on each package
  let allSuccess = true;
  const allIssues: DartAnalyzeIssue[] = [];
  let combinedOutput = '';

  for (const packageRoot of packageRoots) {
    try {
      const output = dartAnalyzeRunner(packageRoot, timeout);
      combinedOutput += output;
    } catch (error: unknown) {
      const result = processDartAnalyzeError(error, packageRoot, timeout);
      allSuccess = false;
      combinedOutput += result.output;
      allIssues.push(...result.issues);
    }
  }

  // Extract unique file paths with issues
  const filesWithIssues = [...new Set(allIssues.map(issue => issue.filePath))];

  return {
    success: allSuccess,
    filesWithIssues,
    issues: allIssues,
    rawOutput: combinedOutput,
  };
}
