# Dart Commands

Dart-related utilities for working with Dart/Flutter projects.

## Available Commands

```bash
tsu dart check                    # Check if in a Dart package
tsu dart root                     # Get Dart package root
tsu dart changed                  # Show changed Dart files
```

For git / claude hook commands (format, analyze, dcm, graphql), see the [hook documentation](hook.md).

## Command Details

### `dart check`

Checks if the current directory is part of a Dart package. Returns exit code only.

### `dart root`

Outputs the Dart package root path to stdout (the directory containing `pubspec.yaml`).

### `dart changed`

Outputs changed Dart files (one per line) to stdout, excluding generated files.

## Verbose Mode

All commands support the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
