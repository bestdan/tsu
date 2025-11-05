# Hook Commands

Git hook utilities for Dart/Flutter projects.

## Available Commands

```bash
tsutils hook format check        # Format modified Dart files (for git hooks)
tsutils hook analysis check      # Run dart analyze on modified Dart files
tsutils hook fix check           # Run dart fix on modified Dart files
tsutils hook dcm fix check       # Run DCM fix on modified Dart files (for git hooks)
tsutils hook dcm analyze check   # Run DCM analyze on modified Dart files
tsutils hook graphql check       # Check GraphQL codegen is up to date (for git hooks)
```

## Command Details

### `hook format check`

Formats modified Dart files (excluding generated files) and exits with error if changes were made. Perfect for pre-push hooks.

**How it works:**
1. Gets all modified Dart files (excluding generated files)
2. Runs `dart format` on those files
3. Checks if formatting created any changes
4. Exits with error (non-zero) if changes were made
5. Exits successfully if no changes were needed

**Requirements**: Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook format check || exit 1
```

### `hook analysis check`

Runs dart analyze on modified Dart files (excluding generated files) and exits with error if issues are found. Perfect for pre-push hooks.

**How it works:**
1. Gets all modified Dart files (excluding generated files)
2. Maps files to their package roots
3. Runs `dart analyze` on each unique package
4. Exits with error if dart analyze reports any issues

**Requirements**: Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook analysis check || exit 1
```

### `hook fix check`

Runs dart fix on modified Dart files (excluding generated files) and exits with error if fixes were applied. Perfect for pre-push hooks.

**How it works:**
1. Gets all modified Dart files (excluding generated files)
2. Runs `dart fix --apply` on each file individually
3. Checks if fixes created any changes
4. Exits with error (non-zero) if changes were made
5. Exits successfully if no changes were needed

**Requirements**: Dart SDK must be installed. Get it from https://dart.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook fix check || exit 1
```

### `hook dcm fix check`

Runs DCM fix on modified Dart files (excluding generated files) and exits with error if fixes were applied. Perfect for pre-push hooks. Skips gracefully if DCM is not installed.

**How it works:**
1. Checks if DCM is installed, skips if not
2. Gets all modified Dart files (excluding generated files)
3. Runs `dcm fix` on those files
4. Checks if DCM made any changes
5. Exits with error (non-zero) if changes were made
6. Exits successfully if no changes were needed

**Requirements**: DCM is optional. Install from https://dcm.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook dcm fix check || exit 1
```

### `hook dcm analyze check`

Runs DCM analyze on modified Dart files (excluding generated files) and exits with error if issues are found. Perfect for pre-push hooks. Skips gracefully if DCM is not installed.

**How it works:**
1. Checks if DCM is installed, skips if not
2. Gets all modified Dart files (excluding generated files)
3. Runs `dcm analyze` on those files
4. Exits with error if DCM analyze reports any issues

**Requirements**: DCM is optional. Install from https://dcm.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook dcm analyze check || exit 1
```

### `hook graphql check`

Checks if GraphQL files have been modified and runs code generation (`melos run codegen:graphql` and `melos run codegen:graphql:test`) to ensure fakes are up to date. Exits with error if code generation creates changes. Perfect for pre-push hooks. Skips gracefully if melos is not installed.

**How it works:**
1. Checks if Melos is installed, skips if not
2. Checks if any GraphQL files (`.graphql`) have been modified
3. If modified, runs GraphQL code generation commands
4. Checks if code generation created any changes
5. Exits with error (non-zero) if changes were made
6. Exits successfully if no changes were needed or no GraphQL files modified

**Requirements**: Melos is optional. Install from https://melos.invertase.dev

**Example usage in git hooks:**
```bash
# In .git/hooks/pre-push or lefthook.yml
tsutils hook graphql check || exit 1
```

## Verbose Mode

All commands support the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
