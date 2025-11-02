# Test Coverage Documentation

## Current Coverage Status

The codebase maintains high test coverage with comprehensive test suites for all major functionality. Current coverage levels as of the latest test run:

- **Statements**: ~85.5%
- **Branches**: ~74.8%
- **Functions**: ~90.6%
- **Lines**: ~85.5%

## Intentionally Uncovered Code

The following code sections are intentionally not covered by automated tests due to their nature:

### 1. Claude CLI Integration Functions (`src/utils/git.ts`)

**Functions:**

- `generateCommitMessage()` (lines 257-312)
- `generatePRDescription()` (lines 327-387)

**Reason:** These functions require the external Claude CLI tool to be installed and configured. They:

- Make external API calls that would require mocking complex external services
- Are integration points for AI-powered features
- Are marked with `/* c8 ignore start/stop */` comments for the v8 coverage provider
- Are tested manually through the CLI commands that use them

**Testing approach:** These are tested manually and through integration testing, not unit tests.

### 2. Error Handling Catch Blocks (`src/utils/git.ts`)

**Lines:** 141, 164, 188, 227

**Reason:** These are defensive error handling blocks in functions like:

- `getChangedFiles()` (line 141)
- `getCurrentBranch()` (line 164)
- `getStagedDiff()` (line 188)
- `getBranchDiff()` (line 227)

These catch blocks only execute when git commands fail in unexpected ways that are difficult to reproduce in a test environment without significant mocking complexity.

### 3. Edge Cases in Dart Package Import Resolution (`src/utils/dart.ts`)

**Lines:** 82

**Reason:** Line 82 is a defensive check for undefined import paths that would only occur if the regex match failed unexpectedly. This edge case is nearly impossible to trigger in practice.

**Note:** Lines 104-105 and 116-119 (monorepo and non-standard package structures) are now covered by comprehensive test fixtures added in `src/__fixtures__/dart-monorepo` and `src/__fixtures__/dart-nonstandard`.

## Coverage Thresholds

The project maintains the following coverage thresholds in `vitest.config.ts`:

- Statements: 85%
- Branches: 74%
- Functions: 90%
- Lines: 85%

These thresholds are set to:

1. Ensure all meaningful code paths are tested
2. Allow for reasonable exceptions for external integrations and defensive error handling
3. Prevent coverage regressions

**Note on Coverage Provider**: The project uses v8 coverage provider, which is the default and most performant option for Node.js 22+. Requires Node.js 22.0.0 or higher.

## Improving Coverage

To improve coverage beyond current levels:

1. **For Claude CLI functions**: Consider creating integration tests with mocked `execSync` calls, though this would test the mocking infrastructure more than the actual functionality.

2. **For error handling blocks**: Consider adding tests that force git command failures through environment manipulation or complex mocking.

3. **For Dart edge cases**: ✅ **DONE** - Comprehensive test fixtures now cover monorepo and non-standard package structures.

## Note on c8 Ignore Comments

The codebase includes `/* c8 ignore start/stop */` comments around the Claude CLI functions to exclude them from coverage reporting. These comments are honored by the v8 coverage provider and prevent these external integration functions from counting against coverage metrics.
