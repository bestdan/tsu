# Files Commands

File-related utilities for filtering and processing files.

## Available Commands

```bash
tsutils files filter [options]        # Filter files by suffix/extension
```

## Command Details

### `files filter`

Filter files by suffix or extension. Reads file paths from stdin and outputs filtered paths to stdout.

**Options:**
- `--suffix <suffix>`: Filter files by suffix (e.g., `.dart`, `.ts`, `.json`)
- Multiple suffixes can be specified by using the flag multiple times

**Example usage:**
```bash
# Filter only TypeScript files from changed files
tsutils git changed | tsutils files filter --suffix .ts

# Filter Dart and TypeScript files
tsutils git changed | tsutils files filter --suffix .dart --suffix .ts

# Combine with other commands
tsutils git changed --all | tsutils files filter --suffix .json | xargs cat
```

## Pipe-Friendly Output

The `files filter` command is designed to work seamlessly in Unix pipelines:
- Reads file paths from stdin (one per line)
- Outputs filtered file paths to stdout (one per line)
- Supports `--verbose` flag for debugging output to stderr

## Verbose Mode

Use the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
