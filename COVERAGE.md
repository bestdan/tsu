# Test Coverage Documentation

## Current Coverage Status

The codebase maintains high test coverage with comprehensive test suites for all major functionality. Current coverage levels as of the latest test run:

- **Statements**: ~76%
- **Branches**: ~70%
- **Functions**: ~79%
- **Lines**: ~77%

## Coverage Philosophy

This project uses `/* v8 ignore */` comments to mark code that cannot be tested without external dependencies (DCM, dart format, melos, Claude CLI). While this doesn't exclude the code from coverage calculations, it clearly documents WHY certain code paths are intentionally untested.

### Coverage Thresholds (vitest.config.ts)

- **Statements**: 76%
- **Branches**: 69%
- **Functions**: 79%
- **Lines**: 76%

These thresholds reflect the overall codebase coverage including external tool integrations. They ensure:
1. Core business logic maintains high coverage (85-100%)
2. Files with external dependencies don't prevent CI from passing
3. New code is held to reasonable standards

## Files with External Tool Dependencies

The following files have lower coverage due to integration with external CLI tools. The untestable portions are marked with `/* v8 ignore start/stop */` comments:

### 1. `src/commands/dart/hook/dcm/check.ts` (42% coverage)
- **Integrates with**: DCM (Dart Code Metrics) CLI
- **Marked with v8 ignore**: Lines 68-111 (executing `dcm fix` and checking results)
- **Well-tested**: Precondition checks, file filtering, error handling flows
- **Manual testing**: Actual DCM integration tested via lefthook pre-push hooks

### 2. `src/commands/dart/hook/format/check.ts` (51% coverage)
- **Integrates with**: `dart format` CLI
- **Marked with v8 ignore**: Lines 71-104 (executing `dart format` and checking results)
- **Well-tested**: Precondition checks, file filtering
- **Manual testing**: Actual formatting tested via lefthook pre-push hooks

### 3. `src/commands/dart/hook/graphql/check.ts` (28% coverage)
- **Integrates with**: `melos` CLI for GraphQL code generation
- **Marked with v8 ignore**: Lines 60-154 (executing melos commands and comparing git status)
- **Well-tested**: Precondition checks, file detection
- **Manual testing**: Actual codegen tested via lefthook pre-push hooks

### 4. `src/commands/dart/fix.ts` (81% coverage)
- **Integrates with**: `dart fix` and handles user interaction
- **Lower coverage reason**: Interactive prompts and some edge case error handling
- **Well-tested**: Core logic and non-interactive paths

### 5. `src/utils/git.ts` (65% coverage)
- **Integrates with**: Claude CLI for AI-powered features
- **Marked with c8/v8 ignore**: 
  - `generateCommitMessage()` (lines 274-328)
  - `generatePRDescription()` (lines 345-403)
- **Well-tested**: Core git operations
- **Manual testing**: Claude CLI integration

### 6. `src/utils/shell.ts` (20% coverage)
- **Lower coverage reason**: `isCommandInstalled()` requires checking for actual commands on system
- **Well-tested**: `escapeShellArg()` function
- **Indirectly tested**: Command detection tested through dependent code

## Using V8 Ignore Comments

External tool integration code is marked with ignore comments to document why it's untestable:

```typescript
/* v8 ignore start - External tool integration not testable without DCM installed */
try {
  execSync(`dcm fix ${fileArgs}`, { cwd, stdio: 'pipe' });
} catch (error) {
  console.error('Error: Failed to run dcm fix');
  process.exit(1);
}
// Check if DCM created changes...
/* v8 ignore stop */
```

**Note**: While `/* v8 ignore */` comments document intentionally untested code, vitest v4.0.5's coverage provider still includes this code in threshold calculations. Future versions may support per-file thresholds more robustly.

## What IS Well-Tested (85-100% coverage)

1. **Core business logic**
   - Dart package detection and import resolution (95% coverage)
   - File filtering and dependency graph building (100% coverage)
   - Command helper utilities (100% coverage)

2. **Error handling flows**
   - Not in git repo → proper exit codes and messages
   - Not in Dart package → proper error messages
   - Invalid input → null returns or appropriate errors

3. **Integration with fixtures**
   - Real Dart package fixtures
   - Dart monorepo structures
   - Non-standard package layouts

## Test Suite Quality

The test suite was improved in 2024 by removing 600 lines (17%) of low-quality tests:
- Over-mocked external tool tests that only verified command strings
- Weak assertions that accepted any value
- Redundant "default parameters" tests

Result: A focused test suite testing **business logic and error handling** rather than mocking infrastructure.

## Alternative Approaches Considered

We considered using vitest's per-file coverage thresholds to maintain higher default thresholds while allowing exceptions for specific files. However, both vitest 4.0.5 and 4.0.6's per-file threshold feature don't apply file-specific thresholds correctly - when `perFile: true` is set, vitest still checks all files against the global thresholds rather than applying file-specific overrides.

Future options if vitest improves:
1. **Per-file thresholds**: Set default 85% with exceptions for external tool integration files
2. **Separate files**: Extract external tool code into separate files that can be excluded via patterns

## Improving Coverage

To improve coverage beyond current levels would require:

1. **External tool integrations**: Set up real integration test environments with Dart, DCM, melos installed (beyond unit test scope)
2. **Claude CLI functions**: Requires external API access, best tested manually
3. **Error handling blocks**: Defensive code paths that only execute on unexpected failures

The current approach balances test quality, CI reliability, and clear documentation of what is/isn't testable.
