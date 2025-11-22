import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { ensureCondition } from '../utils/command-helpers.js';
import { isCommandInstalled } from '../utils/shell.js';
import { findAffectedPackages } from '../utils/dart.js';
import { getChangedFiles } from '../utils/git.js';
export function dartValidateFix(options = {}) {
    const verbose = options.verbose || false;
    const apply = options.apply || false;
    let files = options.files || [];
    ensureCondition(isCommandInstalled('dart'), verbose ? '⚠️  Warning: dart not installed, skipping' : '', { exitCode: 0 });
    if (verbose) {
        console.error(`🔧 Running dart fix ${apply ? '(applying fixes)' : '(dry-run)'}...`);
    }
    const cwd = process.cwd();
    if (files.length === 0) {
        const stagedFiles = getChangedFiles({ type: 'staged', baseBranch: 'main' });
        if (stagedFiles === null) {
            console.error('Error: Failed to get staged files');
            process.exit(1);
        }
        files = stagedFiles.filter((f) => f.endsWith('.dart'));
        if (files.length === 0) {
            if (verbose) {
                console.error('✓ No staged Dart files to check with dart fix');
            }
            process.exit(0);
        }
    }
    const affectedPackages = findAffectedPackages(files, cwd);
    if (affectedPackages.size === 0) {
        if (verbose) {
            console.error('✓ No Dart packages to check with dart fix');
        }
        process.exit(0);
    }
    validatePackages(affectedPackages, cwd, verbose, apply);
}
function validatePackages(packages, cwd, verbose, apply) {
    let hasErrors = false;
    for (const [location, packageName] of packages) {
        if (verbose) {
            console.error(`Running dart fix ${apply ? '' : '(dry-run) '}on ${packageName}...`);
        }
        const packagePath = resolve(cwd, location);
        if (!existsSync(packagePath)) {
            console.error(`Error: Package path not found: ${packagePath}`);
            hasErrors = true;
            continue;
        }
        try {
            const command = apply ? 'dart fix --apply' : 'dart fix --dry-run';
            const result = execSync(command, {
                cwd: packagePath,
                stdio: verbose ? 'pipe' : 'pipe',
                encoding: 'utf-8',
            });
            if (!apply && result.includes('suggested fixes')) {
                console.error(`⚠️  ${packageName} has suggested fixes available`);
                if (verbose) {
                    console.error(result);
                }
                hasErrors = true;
            }
            else if (verbose) {
                console.error(`✓ ${packageName} dart fix passed`);
                if (result.trim()) {
                    console.error(result);
                }
            }
        }
        catch (error) {
            console.error(`❌ ${packageName} dart fix failed`);
            if (verbose && error instanceof Error) {
                const execError = error;
                if (execError.stdout)
                    console.error(execError.stdout);
                if (execError.stderr)
                    console.error(execError.stderr);
            }
            hasErrors = true;
        }
    }
    if (hasErrors) {
        if (!apply) {
            console.error('');
            console.error('💡 Run with --apply to automatically apply fixes');
        }
        process.exit(1);
    }
    if (verbose) {
        console.error('✓ All dart fix checks passed');
    }
    process.exit(0);
}
//# sourceMappingURL=dart-validate-fix.js.map