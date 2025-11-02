import { dartValidateFormat } from './dart-validate-format.js';
import { dartValidateAnalysis } from './dart-validate-analysis.js';
import { dartValidateDcm } from './dart-validate-dcm.js';
import { dartValidateFreezed } from './dart-validate-freezed.js';

export interface DartValidateAllOptions {
  verbose?: boolean;
  /** Files or directories to validate */
  files?: string[];
  /** Suffixes to exclude from formatting. Defaults to common codegen suffixes */
  excludeSuffixes?: string[];
  /** Skip format validation */
  skipFormat?: boolean;
  /** Skip analysis validation */
  skipAnalysis?: boolean;
  /** Skip DCM validation */
  skipDcm?: boolean;
  /** Skip freezed validation */
  skipFreezed?: boolean;
}

/**
 * Runs all Dart validation checks (format, analysis, DCM, freezed).
 * This command aggregates all validation commands and runs them in sequence.
 */
export function dartValidateAll(options: DartValidateAllOptions = {}): void {
  const verbose = options.verbose || false;

  if (verbose) {
    console.error('🚀 Running all Dart validation checks...');
    console.error('');
  }

  let hasErrors = false;

  // Run format validation
  if (!options.skipFormat) {
    try {
      dartValidateFormat({
        verbose,
        files: options.files,
        excludeSuffixes: options.excludeSuffixes,
      });
    } catch (error) {
      hasErrors = true;
      if (verbose) {
        console.error('Format validation failed');
      }
    }
  }

  // Run analysis validation
  if (!options.skipAnalysis) {
    try {
      dartValidateAnalysis({
        verbose,
        files: options.files,
      });
    } catch (error) {
      hasErrors = true;
      if (verbose) {
        console.error('Analysis validation failed');
      }
    }
  }

  // Run DCM validation
  if (!options.skipDcm) {
    try {
      dartValidateDcm({
        verbose,
        files: options.files,
      });
    } catch (error) {
      hasErrors = true;
      if (verbose) {
        console.error('DCM validation failed');
      }
    }
  }

  // Run freezed validation (only if files are provided)
  if (!options.skipFreezed && options.files && options.files.length > 0) {
    try {
      dartValidateFreezed({
        verbose,
        files: options.files,
      });
    } catch (error) {
      hasErrors = true;
      if (verbose) {
        console.error('Freezed validation failed');
      }
    }
  }

  if (hasErrors) {
    console.error('');
    console.error('❌ Some validation checks failed');
    process.exit(1);
  }

  if (verbose) {
    console.error('');
    console.error('✓ All validation checks passed');
  }
  process.exit(0);
}
