# Hook Commands

Git / Claude hook utilities for Dart/Flutter projects.

**Requirements:**
- All hook commands must be run in a git repository
- Dart-specific hooks (`format`, `analysis`, `fix`, `dcm`, `graphql`) must be run in a Dart package

## Available Commands

```bash
tsutils hook format check        # Format Dart files about to be pushed (for git hooks)
tsutils hook analysis check      # Run dart analyze on Dart files about to be pushed
tsutils hook fix check           # Run dart fix on Dart files about to be pushed
tsutils hook dcm fix check       # Run DCM fix on Dart files about to be pushed (for git hooks)
tsutils hook dcm analyze check   # Run DCM analyze on Dart files about to be pushed
tsutils hook graphql check       # Check GraphQL codegen is up to date (for git hooks)
tsutils hook collate             # Run multiple hook checks concurrently
```

## Hook Collate Command

The `hook collate` command runs multiple hook checks concurrently and provides a unified summary of all results. This is the recommended way to use multiple hooks in your git workflow.

**Basic usage:**
```bash
# Run all checks (default)
tsutils hook collate

# Run specific checks
tsutils hook collate --dart-format --dart-analysis

# Use with config file
tsutils hook collate --with-config

# Verbose output
tsutils hook collate --verbose
```

**How it works:**
1. Determines which hooks to run (default: all applicable hooks)
2. Runs selected checks concurrently for efficiency
3. Tracks failures and continues running remaining checks
4. Provides a unified summary of all results
5. Exits with code 1 if any check fails, 0 if all pass

**Check selection flags:**
- `--dart-format` - Run only dart format check
- `--dart-analysis` - Run only dart analysis check
- `--dcm-analyze` - Run only DCM analyze check
- `--graphql` - Run only GraphQL check
- `--codeowners` - Run only git codeowners check

If no flags are specified, all checks run by default. If any flag is specified, only those checks run.

**Config file support:**

Use the `--with-config` flag to load timeout settings from a config file. Config files are searched in this order:
1. `.tsurc` (current directory, then parent directories)
2. `.tsurc.json` (current directory, then parent directories)
3. `tsu.config.json` (current directory, then parent directories)
4. `.tsu.config.json` (current directory, then parent directories)
5. Home directory (`~/.tsurc`, `~/.tsurc.json`, etc.)

**Config file format:**
```json
{
  "timeout": 5000,
  "hook": {
    "collate": {
      "timeout": 20000,
      "checks": {
        "dart-format": { "timeout": 3000 },
        "dart-analysis": { "timeout": 15000 },
        "dcm-analyze": { "timeout": 10000 },
        "graphql": { "timeout": 30000 },
        "codeowners": { "timeout": 5000 }
      }
    }
  }
}
```

**Timeout resolution:**
- Per-check timeout (most specific) > Command timeout > Global timeout
- Timeouts are in milliseconds
- If no timeout is specified, commands run without timeout limits

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push
#!/bin/bash
set -o pipefail
echo "📋 Running pre-push tsu checks"
tsu hook collate --with-config || exit 1
```

## File Filtering Options

By default, all hook commands check **files that would be pushed** (commits on your branch that haven't been pushed yet). You can override this with:

- `--staged` - Check only staged files
- `--unstaged` - Check only unstaged files
- `--all` - Check all changes (committed + staged + unstaged)
- `--base-branch <branch>` - Compare against a custom base branch (default: `main`)

**Examples:**
```bash
# Check files to be pushed (default)
tsutils hook format check

# Check only staged files
tsutils hook format check --staged

# Check all changes including unstaged
tsutils hook format check --all

# Compare against develop branch instead of main
tsutils hook format check --base-branch develop
```

## Command Details

### `hook format check`

Formats Dart files about to be pushed (excluding generated files) and exits with error if changes were made. Perfect for pre-push hooks.

**How it works:**
1. Gets Dart files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
2. Filters out generated files (files ending with common codegen suffixes)
3. Runs `dart format` on those files
4. Checks if formatting created any changes
5. Exits with error (non-zero) if changes were made
6. Exits successfully if no changes were needed

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook format check || exit 1
```

### `hook analysis check`

Runs dart analyze on Dart files about to be pushed (excluding generated files) and exits with error if issues are found. Perfect for pre-push hooks.

**How it works:**
1. Gets Dart files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
2. Filters out generated files
3. Maps files to their package roots
4. Runs `dart analyze` on each unique package
5. Exits with error if dart analyze reports any issues

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook analysis check || exit 1
```

### `hook fix check`

Runs dart fix on Dart files about to be pushed (excluding generated files) and exits with error if fixes were applied. Perfect for pre-push hooks.

**How it works:**
1. Gets Dart files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
2. Filters out generated files
3. Runs `dart fix --apply` on each file individually
4. Checks if fixes created any changes
5. Exits with error (non-zero) if changes were made
6. Exits successfully if no changes were needed

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook fix check || exit 1
```

### `hook dcm fix check`

Runs DCM fix on Dart files about to be pushed (excluding generated files) and exits with error if fixes were applied. Perfect for pre-push hooks. Skips gracefully if DCM is not installed.

**How it works:**
1. Checks if DCM is installed, skips if not
2. Gets Dart files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
3. Filters out generated files
4. Runs `dcm fix` on those files
5. Checks if DCM made any changes
6. Exits with error (non-zero) if changes were made
7. Exits successfully if no changes were needed

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- DCM is optional. Install from https://dcm.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook dcm fix check || exit 1
```

### `hook dcm analyze check`

Runs DCM analyze on Dart files about to be pushed (excluding generated files) and exits with error if issues are found. Perfect for pre-push hooks. Skips gracefully if DCM is not installed.

**How it works:**
1. Checks if DCM is installed, skips if not
2. Gets Dart files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
3. Filters out generated files
4. Runs `dcm analyze` on those files
5. Exits with error if DCM analyze reports any issues

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- DCM is optional. Install from https://dcm.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook dcm analyze check || exit 1
```

### `hook graphql check`

Checks if GraphQL files have been modified and runs code generation (`melos run codegen:graphql` and `melos run codegen:graphql:test`) to ensure fakes are up to date. Exits with error if code generation creates changes. Perfect for pre-push hooks. Skips gracefully if melos is not installed.

**How it works:**
1. Checks if Melos is installed, skips if not
2. Gets files about to be pushed (or based on `--staged`, `--unstaged`, `--all` options)
3. Checks if any GraphQL files (`.graphql`) are in that set
4. If modified, runs GraphQL code generation commands
5. Checks if code generation created any changes
6. Exits with error (non-zero) if changes were made
7. Exits successfully if no changes were needed or no GraphQL files modified

**Requirements**: 
- Must be run in a git repository
- Must be run in a Dart package
- Melos is optional. Install from https://melos.invertase.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook graphql check || exit 1
```

## Verbose Mode

All commands support the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
