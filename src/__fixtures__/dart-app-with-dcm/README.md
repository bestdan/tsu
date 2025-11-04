# Dart App with DCM Test Fixture

This is a test fixture for testing Dart and DCM (Dart Code Metrics) functionality in tsutils.

## Structure

This fixture contains a simple Dart monorepo with two packages:

### Package 1: `core`
- Location: `packages/core/`
- A library package with utility functions and models
- Exports: `User` class and utility functions

### Package 2: `app`
- Location: `packages/app/`
- An application package that depends on `core`
- Contains a main entry point that uses the core library

## Features

- **Melos configuration**: Root-level `melos.yaml` for managing multiple packages
- **DCM configuration**: `analysis_options.yaml` with DCM plugin and rules
- **Package-level analysis options**: Each package includes the root analysis options
- **Proper Dart structure**: Standard Dart project structure with `lib/` and `test/` directories
- **Cross-package dependencies**: The `app` package depends on the `core` package

## Testing Use Cases

This fixture can be used to test:

1. **DCM analyze**: Running `dcm analyze` on files with DCM configuration
2. **DCM fix**: Running `dcm fix` to auto-fix code style issues
3. **Dart formatting**: Testing `dart format` on Dart files
4. **Package discovery**: Finding Dart packages in a monorepo structure
5. **Dependency resolution**: Testing import resolution across packages
6. **Git hooks**: Testing pre-commit hooks for Dart files

## Files Included

```
dart-app-with-dcm/
├── melos.yaml                    # Melos monorepo configuration
├── analysis_options.yaml         # Root DCM and linter configuration
└── packages/
    ├── core/
    │   ├── pubspec.yaml
    │   ├── analysis_options.yaml
    │   ├── lib/
    │   │   ├── core.dart         # Library export file
    │   │   ├── user.dart         # User model
    │   │   └── utils.dart        # Utility functions
    │   └── test/
    │       └── user_test.dart    # User tests
    └── app/
        ├── pubspec.yaml
        ├── analysis_options.yaml
        ├── lib/
        │   └── main.dart         # Main application entry point
        └── test/
            └── app_test.dart     # App tests
```
