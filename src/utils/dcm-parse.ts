import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { findDartPackageRoot } from '../commands/dart/utils/dart.js';

interface DcmAnalyzeResult {
  path: string;
  issues: Array<{
    id: string;
    location: {
      startLine: number;
      startColumn: number;
      endLine: number;
      endColumn: number;
      startOffset: number;
    };
    message: string;
    effortInMinutes: number;
    documentation: string;
    severity: string;
  }>;
}

interface DcmAnalyzeOutput {
  formatVersion: number;
  timestamp: string;
  summary: Array<{
    title: string;
    value: number;
  }>;
  analyzeResults: DcmAnalyzeResult[];
}

export function parseDcmAnalyzeOutput(jsonOutput: string): string[] {
  try {
    // DCM may output human-readable text before the JSON
    // Try to find the JSON object in the output
    const jsonMatch = jsonOutput.match(/\{.*\}/s);
    if (!jsonMatch) {
      return [];
    }

    const parsed: DcmAnalyzeOutput = JSON.parse(jsonMatch[0]);
    return parsed.analyzeResults.map((result) => result.path);
  } catch {
    return [];
  }
}

export interface CallAndParseDcmOptions {
  cwd: string;
  timeout?: number;
  files?: string[];
}

export interface CallAndParseDcmResult {
  success: boolean;
  filesWithIssues: string[];
  rawOutput?: string;
}

/**
 * Runs DCM analyze for a single package root.
 * Separated for easier testing and to avoid scattering v8 ignore comments.
 */
/* v8 ignore next -- @preserve */
function runDcmForPackage(packageRoot: string, timeout: number): string {
  return execSync(
    'dcm analyze . --fatal-style --fatal-warnings --no-congratulate --reporter=json',
    {
      cwd: packageRoot,
      stdio: 'pipe',
      timeout,
      encoding: 'utf-8',
    }
  );
}

interface DcmRunResult {
  success: boolean;
  output: string;
  filesWithIssues: string[];
}

/**
 * Processes error from DCM execution and extracts results.
 * Distinguishes between timeout/execution errors and DCM finding issues.
 */
function processDcmError(
  error: unknown,
  packageRoot: string,
  timeout: number
): DcmRunResult {
  const err = error as {
    code?: string;
    signal?: string;
    stdout?: Buffer | string;
    stderr?: Buffer | string;
  };

  // Distinguish between timeout/execution errors and DCM finding issues
  if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
    throw new Error(`DCM analyze timed out in ${packageRoot} after ${timeout}ms`);
  }

  // If DCM ran but found issues, stdout will have the JSON report
  const stdout = err.stdout?.toString() || '';
  const stderr = err.stderr?.toString() || '';

  if (stdout.length > 0) {
    // DCM found issues (exit code non-zero but produced JSON output)
    const filesWithIssues = parseDcmAnalyzeOutput(stdout);
    return {
      success: false,
      output: stdout,
      filesWithIssues,
    };
  }

  // DCM failed to run properly - no output
  const errorMsg = stderr.length > 0 ? stderr : 'No output from DCM';
  throw new Error(`DCM analyze failed in ${packageRoot}: ${errorMsg}`);
}

export function dcmAnalyze(
  options: CallAndParseDcmOptions,
  // Allow dependency injection for testing
  dcmRunner: (packageRoot: string, timeout: number) => string = runDcmForPackage
): CallAndParseDcmResult {
  const { cwd, timeout = 7000, files } = options;

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

  // Run DCM analyze on each package
  let allSuccess = true;
  const allFilesWithIssues: string[] = [];
  let combinedOutput = '';

  for (const packageRoot of packageRoots) {
    try {
      const output = dcmRunner(packageRoot, timeout);
      combinedOutput += output;
    } catch (error: unknown) {
      const result = processDcmError(error, packageRoot, timeout);
      allSuccess = false;
      combinedOutput += result.output;
      allFilesWithIssues.push(...result.filesWithIssues);
    }
  }

  return {
    success: allSuccess,
    filesWithIssues: allFilesWithIssues,
    rawOutput: combinedOutput,
  };
}
