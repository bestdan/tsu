# DCM Integration Tests

This directory contains integration tests that verify DCM (Dart Code Metrics) commands correctly use `analysis_options.yaml` to enforce custom rules.

## Test Overview

The integration tests in `integration.test.ts` verify:

1. **Rule Detection**: DCM analyze detects violations of custom rules defined in `analysis_options.yaml`
2. **Fix Application**: DCM fix can automatically fix violations based on the rules
3. **Configuration Hierarchy**: DCM respects the analysis_options.yaml hierarchy (package-level includes root-level)

## Test Fixture

The tests use the `dart-app-with-dcm` fixture which includes:

- Root `analysis_options.yaml` with DCM rules including `prefer-trailing-comma`
- Package-level `analysis_options.yaml` that inherits from root via `include: ../../analysis_options.yaml`
- `packages/core/lib/config.dart` - A file intentionally violating the `prefer-trailing-comma` rule

## Running the Tests

### Prerequisites

To run these integration tests with actual DCM execution, you need:

1. Dart SDK installed
2. DCM (Dart Code Metrics) installed: `dart pub global activate dart_code_metrics`

### Test Execution

```bash
# Run the integration tests
pnpm test:run src/commands/dart/hook/dcm/integration.test.ts

# Or run all tests
pnpm test:run
```

### When DCM is Not Installed

The tests gracefully skip when DCM is not installed in the environment, printing:
```
Skipping DCM integration test: dcm not installed
```

This allows the test suite to run in CI/CD environments where DCM may not be available.

## Test Cases

### 1. Detect Rule Violations

Verifies that `dcm analyze` fails when code violates rules from `analysis_options.yaml`:

```typescript
it('should detect violations of prefer-trailing-comma rule', () => {
  // config.dart has missing trailing commas
  // DCM analyze should fail and report the violation
});
```

### 2. Fix Violations

Verifies that `dcm fix` can automatically fix violations:

```typescript
it('should fix violations using dcm fix', () => {
  // Run dcm fix on config.dart
  // Verify trailing commas are added
  // Verify dcm analyze now passes
});
```

### 3. Configuration Hierarchy

Verifies that DCM respects the analysis_options.yaml inheritance:

```typescript
it('should respect analysis_options.yaml rules hierarchy', () => {
  // Package includes root analysis_options.yaml
  // DCM should enforce rules from root config
});
```

## Example Violations

The `config.dart` file contains intentional violations:

```dart
// Missing trailing comma (violates prefer-trailing-comma)
const Config(
  this.appName,
  this.version,
  this.debugMode
);  // Should have comma after debugMode

// Missing trailing comma in map
Map<String, dynamic> toMap() {
  return {
    'appName': appName,
    'version': version,
    'debugMode': debugMode  // Should have trailing comma
  };
}
```

After `dcm fix`, these become:

```dart
const Config(
  this.appName,
  this.version,
  this.debugMode,  // Trailing comma added
);

Map<String, dynamic> toMap() {
  return {
    'appName': appName,
    'version': version,
    'debugMode': debugMode,  // Trailing comma added
  };
}
```

## Benefits

These integration tests ensure:

1. **Correctness**: DCM commands actually use the `analysis_options.yaml` configuration
2. **Real-world scenarios**: Tests run against actual Dart code with real DCM analysis
3. **Configuration validation**: Verifies the fixture's DCM setup is working correctly
4. **Regression prevention**: Catches issues where DCM might ignore configuration files

## Future Enhancements

Potential additions:

- Test more DCM rules (avoid-dynamic, avoid-unused-parameters, etc.)
- Test DCM metrics thresholds (cyclomatic-complexity, lines-of-code, etc.)
- Test DCM with different configuration scenarios
- Test DCM's handling of excluded files (*.g.dart, *.freezed.dart)
