import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { findDartPackageRoot } from '../commands/dart/utils/dart.js';
import { logIfVerbose } from './logger.js';
export function isDcmVersionWarning(output) {
    return /Installed DCM version \([\d.]+\) does not match the configured constraint [\d.]+/.test(output);
}
export function isOnlyDcmVersionWarning(output) {
    if (!output || output.trim().length === 0) {
        return false;
    }
    const trimmedOutput = output.trim();
    const versionWarningPattern = /^Installed DCM version \([\d.]+\) does not match the configured constraint [\d.]+\.?$/;
    return versionWarningPattern.test(trimmedOutput);
}
export function handleDcmVersionWarning(output) {
    if (isDcmVersionWarning(output)) {
        const match = output.match(/Installed DCM version \([\d.]+\) does not match the configured constraint [\d.]+\.?/);
        if (match) {
            logIfVerbose(undefined, `⚠️  DCM Warning: ${match[0]}`);
        }
    }
}
export function parseDcmAnalyzeOutput(jsonOutput) {
    try {
        const jsonMatch = jsonOutput.match(/\{.*\}/s);
        if (!jsonMatch) {
            return [];
        }
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.analyzeResults.map((result) => result.path);
    }
    catch {
        return [];
    }
}
function runDcmForPackage(packageRoot, timeout) {
    return execSync('dcm analyze . --fatal-style --fatal-warnings --no-congratulate --reporter=json', {
        cwd: packageRoot,
        stdio: 'pipe',
        timeout,
        encoding: 'utf-8',
    });
}
function processDcmError(error, packageRoot, timeout) {
    const err = error;
    if (err.code === 'ETIMEDOUT' || err.signal === 'SIGTERM') {
        throw new Error(`DCM analyze timed out in ${packageRoot} after ${timeout}ms`);
    }
    const stdout = err.stdout?.toString() || '';
    const stderr = err.stderr?.toString() || '';
    handleDcmVersionWarning(stderr);
    handleDcmVersionWarning(stdout);
    if (stdout.length > 0) {
        const filesWithIssues = parseDcmAnalyzeOutput(stdout);
        return {
            success: false,
            output: stdout,
            filesWithIssues,
        };
    }
    if (stderr.length > 0 && isOnlyDcmVersionWarning(stderr)) {
        return {
            success: true,
            output: stderr,
            filesWithIssues: [],
        };
    }
    const errorMsg = stderr.length > 0 ? stderr : 'No output from DCM';
    throw new Error(`DCM analyze failed in ${packageRoot}: ${errorMsg}`);
}
export function dcmAnalyze(options, dcmRunner = runDcmForPackage) {
    const { cwd, timeout = 7000, files } = options;
    const packageRoots = new Set();
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
        packageRoots.add(cwd);
    }
    let allSuccess = true;
    const allFilesWithIssues = [];
    let combinedOutput = '';
    for (const packageRoot of packageRoots) {
        try {
            const output = dcmRunner(packageRoot, timeout);
            combinedOutput += output;
            handleDcmVersionWarning(output);
        }
        catch (error) {
            const result = processDcmError(error, packageRoot, timeout);
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
