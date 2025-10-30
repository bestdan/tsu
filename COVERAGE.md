# Test Coverage Documentation

## Current Coverage Status

The codebase maintains high test coverage with comprehensive test suites for all major functionality. Current coverage levels as of the latest test run:

- **Statements**: ~82%
- **Branches**: ~72%
- **Functions**: ~91%
- **Lines**: ~82%

## Intentionally Uncovered Code

The following code sections are intentionally not covered by automated tests due to their nature:

### 1. Claude CLI Integration Functions (`src/utils/git.ts`)

**Functions:**
- `generateCommitMessage()` (lines 257-311)
- `generatePRDescription()` (lines 327-387)

**Reason:** These functions require the external Claude CLI tool to be installed and configured. They:
- Make external API calls that would require mocking complex external services
- Are integration points for AI-powered features
- Are marked with `/* c8 ignore */` comments (though vitest v8 doesn't fully support these)
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

**Lines:** 82, 87, 104-105, 116-119

**Reason:** These are edge cases in Dart package import resolution:
- Line 82: Defensive check for undefined import paths
- Line 87: Dart SDK import continue statement (tested but branch not covered)
- Lines 104-105, 116-119: Non-standard package import resolution paths for complex mono-repo structures

These would require complex test fixtures with specific Dart package structures that are not commonly used.

## Coverage Thresholds

The project maintains the following coverage thresholds in `vitest.config.ts`:

- Statements: 82%
- Branches: 72%
- Functions: 91%
- Lines: 82%

These thresholds are set to:
1. Ensure all meaningful code paths are tested
2. Allow for reasonable exceptions for external integrations and defensive error handling
3. Prevent coverage regressions

## Improving Coverage

To improve coverage beyond current levels:

1. **For Claude CLI functions**: Consider creating integration tests with mocked `execSync` calls, though this would test the mocking infrastructure more than the actual functionality.

2. **For error handling blocks**: Consider adding tests that force git command failures through environment manipulation or complex mocking.

3. **For Dart edge cases**: Create comprehensive test fixtures covering all possible Dart package structure variations.

## Note on c8 Ignore Comments

The codebase includes `/* c8 ignore start/stop */` comments around the Claude CLI functions. While these are standard for c8 coverage, vitest's v8 coverage provider doesn't fully honor these comments in all cases. This is a known limitation documented in vitest issue trackers.
