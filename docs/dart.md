# Dart Commands

Dart-related utilities for working with Dart/Flutter projects.

## Available Commands

```bash
tsutils dart check                    # Check if in a Dart package
tsutils dart root                     # Get Dart package root
tsutils dart changed                  # Show changed Dart files
```

For git hook commands (format, analyze, dcm, graphql), see the [hook documentation](hook.md).

## Command Details

### `dart check`

Checks if the current directory is part of a Dart package. Returns exit code only.

### `dart root`

Outputs the Dart package root path to stdout (the directory containing `pubspec.yaml`).

### `dart changed`

Outputs changed Dart files (one per line) to stdout, excluding generated files.

## Verbose Mode

All commands support the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
