# Test Coverage Documentation

## Current Coverage Status

The codebase maintains reasonable test coverage focusing on meaningful tests that catch real errors. Current coverage levels as of the latest test run:

- **Statements**: ~76%
- **Branches**: ~70%
- **Functions**: ~79%
- **Lines**: ~77%

## Coverage Philosophy

This project prioritizes **meaningful tests** over high coverage percentages. Tests should:
1. **Catch real bugs** - Test business logic and integration points
2. **Be maintainable** - Avoid over-mocking and brittle test infrastructure
3. **Provide value** - Each test should verify something that could actually break

## Intentionally Uncovered or Lightly Tested Code

### 1. External Tool Integrations

**Files affected:**
- `src/commands/dart/hook/dcm/check.ts` (42% coverage)
- `src/commands/dart/hook/format/check.ts` (51% coverage)  
- `src/commands/dart/hook/graphql/check.ts` (28% coverage)

**Reason:** These commands integrate with external tools (DCM, dart format, melos). The uncovered code paths involve:
- Actually running the external commands with `execSync`
- Checking if the commands modified files
- Error handling when commands fail

**Why not tested:**
- Testing requires mocking `execSync` extensively, which only tests our mocking infrastructure
- Real integration tests would require installing Dart, DCM, melos, and setting up complex project fixtures
- The code that *is* covered tests the important logic: precondition checks, file filtering, and exit code handling

**Testing approach:** These are best validated through:
- Manual testing with real Dart projects
- Using these hooks in actual development (via lefthook)
- The covered portions test all the preconditions and filtering logic

### 2. Claude CLI Integration Functions (`src/utils/git.ts`)

**Functions:**
- `generateCommitMessage()` (lines 274-328)
- `generatePRDescription()` (lines 345-403)

**Reason:** These functions require the external Claude CLI tool to be installed and configured. They:
- Make external API calls that would require mocking complex external services
- Are integration points for AI-powered features
- Are marked with `/* c8 ignore start/stop */` comments for the v8 coverage provider
- Are tested manually through the CLI commands that use them

**Testing approach:** These are tested manually and through integration testing, not unit tests.

### 3. Shell Utility Functions (`src/utils/shell.ts`)

**Coverage:** 20% (only `escapeShellArg` is covered)

**Reason:** The `isCommandInstalled` function runs actual `command -v` checks which are difficult to test across platforms without complex mocking or requiring specific tools to be installed/uninstalled.

### 4. Edge Case Error Handling (`src/utils/git.ts`)

**Lines:** Various catch blocks (141, 181, 205, 244, 277-401, 436, 476-489)

**Reason:** These are defensive error handling blocks that only execute when git commands fail in unexpected ways that are difficult to reproduce without significant mocking complexity.

## Test Suite Quality Improvements (2024)

### Removed Low-Value Tests

The test suite was reduced from 3,486 lines to 2,886 lines (17% reduction, ~600 lines removed) by eliminating:

1. **Over-mocked external tool tests** (~400-500 lines)
   - Tests that mocked `execSync` to verify command strings were constructed correctly
   - These provided false confidence and didn't catch real integration issues
   - Kept: Basic precondition and error handling tests

2. **Weak assertion tests** (~100 lines)
   - Tests with assertions like `expect(typeof result).toBe('boolean')`
   - Tests accepting any value: `expect(result === null || typeof result === 'string').toBe(true)`
   - These verified nothing meaningful

3. **Redundant "default parameters" tests** (~100 lines)
   - Multiple tests verifying functions work without arguments
   - Already covered by other tests with explicit parameters

The result is a leaner, more focused test suite that:
- Runs faster (removed many slow git repository creation tests)
- Is easier to maintain (less mocking complexity)
- Provides more signal, less noise
- Still catches real bugs in business logic

## Coverage Thresholds

The project maintains the following coverage thresholds in `vitest.config.ts`:

- Statements: 75%
- Branches: 69%
- Functions: 78%
- Lines: 75%

These thresholds are set to:
1. Ensure meaningful code paths are tested
2. Allow for reasonable exceptions for external integrations and defensive error handling
3. Prevent coverage regressions while acknowledging that 100% coverage is not the goal

**Note on Coverage Provider**: The project uses v8 coverage provider, which is the default and most performant option for Node.js 22+. Requires Node.js 22.0.0 or higher.

## What IS Well-Tested

Despite lower overall coverage percentages, the test suite effectively covers:

1. **Core business logic**
   - Dart package detection and import resolution
   - Git repository operations (when in a git repo)
   - File filtering and dependency graph building
   - Command helper utilities

2. **Error handling flows**
   - Not in git repo → proper exit codes
   - Not in Dart package → proper error messages
   - Invalid input → null returns or appropriate errors

3. **Integration with fixtures**
   - Real Dart package fixtures for testing package detection
   - Dart monorepo fixtures for complex import resolution
   - Non-standard package structures

4. **Public API contracts**
   - Functions return expected types
   - Functions handle null/undefined inputs gracefully
   - Exit codes match documented behavior

## Improving Coverage

To improve coverage beyond current levels, one would need to:

1. **For external tool integrations**: Create real integration test environments with Dart, DCM, melos installed, which is beyond the scope of unit testing

2. **For Claude CLI functions**: Consider creating integration tests with mocked `execSync` calls, though this would test the mocking infrastructure more than the actual functionality

3. **For error handling blocks**: Consider adding tests that force command failures through environment manipulation or complex mocking

The current coverage levels represent a pragmatic balance between test value and maintenance cost.

## Note on c8 Ignore Comments

The codebase includes `/* c8 ignore start/stop */` comments around the Claude CLI functions to exclude them from coverage reporting. These comments are honored by the v8 coverage provider and prevent these external integration functions from counting against coverage metrics.
