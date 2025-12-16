import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { findDartPackageRoot } from '../commands/dart/utils/dart.js';
import { logIfVerbose } from './logger.js';

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

/**
 * Regular expression pattern for DCM version mismatch warnings.
 * Matches: "Installed DCM version (X.Y.Z) does not match the configured constraint A.B.C"
 * Allows for optional whitespace and trailing period.
 */
const DCM_VERSION_WARNING_PATTERN =
  /Installed\s+DCM\s+version\s+\([\d.]+\)\s+does\s+not\s+match\s+the\s+configured\s+constraint\s+[\d.]+\.?/;

/**
 * Detects if the output contains a DCM version mismatch warning.
 * The warning format is: "Installed DCM version (X.X.X) does not match the configured constraint Y.Y.Y"
 * @param output - The output to check
 * @returns true if a version warning is detected
 */
export function isDcmVersionWarning(output: string): boolean {
  return DCM_VERSION_WARNING_PATTERN.test(output);
}

/**
 * Checks if the output contains ONLY a DCM version mismatch warning (and success messages).
 * This is used to determine if an error should be ignored.
 * Success messages like "✔ no issues found!" or "✔ Analysis is completed" are also allowed.
 * @param output - The output to check
 * @returns true if the output contains only a version warning, success messages, and whitespace
 */
export function isOnlyDcmVersionWarning(output: string): boolean {
  if (!output || output.trim().length === 0) {
    return false;
  }

  // Must contain a version warning
  if (!isDcmVersionWarning(output)) {
    return false;
  }

  // Split into lines and check each non-empty line
  const lines = output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    // Allow version warning lines
    if (DCM_VERSION_WARNING_PATTERN.test(line)) {
      continue;
    }
    // Allow success/completion messages
    if (line.match(/^✔|^✓|Analysis is completed|no issues found|Preparing the results/)) {
      continue;
    }
    // Any other line means it's not just a version warning
    return false;
  }

  return true;
}

/**
 * Extracts and logs DCM version warnings from output if present.
 * Logs warnings only in verbose mode to avoid cluttering output.
 * @param output - The output to check for version warnings
 */
export function handleDcmVersionWarning(output: string): void {
  if (isDcmVersionWarning(output)) {
    const match = output.match(DCM_VERSION_WARNING_PATTERN);
    if (match) {
      logIfVerbose(undefined, `⚠️  DCM Warning: ${match[0]}`);
    }
  }
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
 * Handles version mismatch warnings gracefully by logging them in verbose mode only.
 */
function processDcmError(error: unknown, packageRoot: string, timeout: number): DcmRunResult {
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

  // Check for version warnings in stderr and log them in verbose mode
  handleDcmVersionWarning(stderr);
  handleDcmVersionWarning(stdout);

  if (stdout.length > 0) {
    // DCM found issues (exit code non-zero but produced JSON output)
    const filesWithIssues = parseDcmAnalyzeOutput(stdout);

    // If there are no files with issues but stderr contains only version warning,
    // treat this as success
    if (filesWithIssues.length === 0 && isOnlyDcmVersionWarning(stderr)) {
      return {
        success: true,
        output: stdout + stderr,
        filesWithIssues: [],
      };
    }

    return {
      success: false,
      output: stdout,
      filesWithIssues,
    };
  }

  // Check if stderr contains ONLY a version warning (not a real error)
  if (stderr.length > 0 && isOnlyDcmVersionWarning(stderr)) {
    // Version warning only - not a failure
    return {
      success: true,
      output: stderr,
      filesWithIssues: [],
    };
  }

  // DCM failed to run properly - no output or real errors
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
      // Check for version warnings in successful runs too
      handleDcmVersionWarning(output);
    } catch (error: unknown) {
      const result = processDcmError(error, packageRoot, timeout);
      // Only mark as failure if result indicates actual issues (not just version warning)
      if (!result.success) {
        allSuccess = false;
      }
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
