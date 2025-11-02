# tsutils

TypeScript command line utilities package.

## Setup

This project uses:

- **pnpm** for package management
- **TypeScript** with ESM modules
- **Commander.js** for CLI functionality
- **Vitest** for testing
- **ESLint** for linting
- **Prettier** for code formatting

## Installation

For straight usage:

```bash
# Using npm:
npm install -g github:bestdan/tsu

# Using pnpm:
pnpm add -g github:bestdan/tsu

# Using yarn:
yarn global add github:bestdan/tsu
```

## Usage

After building, link the package globally (`pnpm link --global`):

```bash
# Git commands
tsutils git check
tsutils git root
tsutils git changed
tsutils git changed --staged
tsutils git changed --all
tsutils git commit-msg
tsutils git pr-description

# Dart commands
tsutils dart check
tsutils dart root
tsutils dart changed
tsutils dart hook format check
tsutils dart hook dcm check
tsutils dart hook graphql check

# Dart validation and fix commands
tsutils dart validate format [--files <files...>]
tsutils dart validate analysis [--files <files...>] [--autofix]
tsutils dart validate dcm [--files <files...>]
tsutils dart validate freezed [--files <files...>]
tsutils dart validate all [--files <files...>]
tsutils dart fix [--files <files...>]
```

### Pipe-Friendly Output

All git commands output clean, parseable data to **stdout** by default, making them perfect for piping and chaining with other commands:

```bash
# Boolean checks with git check (exit code only, no output)
if tsutils git check; then
  echo "This is a git repository"
fi

tsutils git check && echo "In a git repo" || echo "Not a git repo"

# Get git root and cd into it
cd "$(tsutils git root)"

# Count changed files
tsutils git changed | wc -l

# Filter only staged files from all changes
tsutils git changed --all | grep "^staged:" | cut -d: -f2

# Process each changed file
tsutils git changed | xargs -I {} echo "Processing: {}"

# Get just the file extensions of changed files
tsutils git changed | xargs -n1 basename | grep -o '\.[^.]*$' | sort | uniq

# Use with other git commands
tsutils git changed --staged | xargs git reset

# Pipe to other tools
tsutils git changed | fzf | xargs code

# Combine git check and git root
tsutils git check && cd "$(tsutils git root)" && echo "Moved to $(pwd)"

# Generate commit message and pipe to git commit
tsutils git commit-msg | git commit -F -

# Generate commit message and review in editor before committing
tsutils git commit-msg > /tmp/commit-msg.txt && vim /tmp/commit-msg.txt && git commit -F /tmp/commit-msg.txt

# Generate PR description and copy to clipboard (macOS)
tsutils git pr-description | pbcopy

# Generate PR description and save to file
tsutils git pr-description > pr-description.md

# Use PR description with gh CLI to create PR
gh pr create --title "Feature: $(git branch --show-current)" --body "$(tsutils git pr-description)"
```

**Command Design for Piping:**

- **`git check`**: Returns exit code only (0=is git repo, 1=not). No stdout output. Perfect for conditionals.
- **`git root`**: Outputs the git root path to stdout. Perfect for `cd "$(tsutils git root)"`.
- **`git changed`**: Outputs filenames (one per line) to stdout. With `--all`, prefixes with type (`committed:`, `staged:`, `unstaged:`).
- **`git commit-msg`**: Generates a commit message from staged changes using Claude CLI. Outputs message to stdout for piping, or use `--commit` to auto-commit.
- **`git pr-description`**: Generates a GitHub PR description from branch changes using Claude CLI. Outputs markdown description to stdout. Compares current branch to main (or `--base-branch`).
- **`dart hook format check`**: Formats modified Dart files (excluding generated files) and exits with error if changes were made. Perfect for pre-push hooks.
- **`dart hook dcm check`**: Runs DCM fix on modified Dart files (excluding generated files) and exits with error if fixes were applied. Perfect for pre-push hooks. Skips gracefully if DCM is not installed.
- **`dart hook graphql check`**: Checks if GraphQL files have been modified and runs code generation (`melos run codegen:graphql` and `melos run codegen:graphql:test`) to ensure fakes are up to date. Exits with error if code generation creates changes. Perfect for pre-push hooks. Skips gracefully if melos is not installed.
- **`dart validate format`**: Validates Dart formatting using `dart format --set-exit-if-changed`. Automatically finds Dart packages by locating pubspec.yaml files. Defaults to staged files, or accepts `--files` parameter. Exits with error if formatting is needed.
- **`dart validate analysis`**: Runs `dart analyze --fatal-infos` on affected packages. Automatically finds Dart packages by locating pubspec.yaml files. Defaults to staged files, or accepts `--files` parameter. Supports `--autofix` to automatically apply fixes if analysis fails. Exits with error if analysis fails (and autofix is not enabled or fails).
- **`dart validate dcm`**: Runs DCM analysis on affected packages. Automatically finds Dart packages by locating pubspec.yaml files. Defaults to staged files, or accepts `--files` parameter. Skips gracefully if DCM is not installed.
- **`dart validate freezed`**: Validates freezed files in features/ directory to ensure generated files are up to date. Runs `dart run build_runner build` and checks for changes. Defaults to staged files, or accepts `--files` parameter.
- **`dart validate all`**: Runs all validation checks (format, analysis, DCM, freezed) in sequence. Supports `--skip-*` flags to skip specific checks.
- **`dart fix`**: Applies Dart fixes using `dart fix --apply` to affected packages. Automatically finds Dart packages by locating pubspec.yaml files. Defaults to staged files, or accepts `--files` parameter.
- **`--verbose`**: All commands support this flag to show human-readable headers/messages to stderr (won't interfere with piping).

## Requirements

- **Node.js**: >=22.0.0
- **Claude CLI**: Required for `git commit-msg` and `git pr-description` commands. Install from https://github.com/anthropics/claude-cli
- **DCM**: Optional for `dart hook dcm check` command. Install from https://dcm.dev
- **Dart SDK**: Required for `dart hook format check` command. Install from https://dart.dev
- **Melos**: Required for `dart hook graphql check` command. Install from https://melos.invertase.dev

## Dart Mono-Repo Support (PACKAGE_INDEX)

The `dart validate *` commands support both standalone Dart packages and mono-repos:

1. **Standalone packages**: Automatically finds packages by looking for `pubspec.yaml` files
2. **Mono-repos with PACKAGE_INDEX** (optional): Uses a PACKAGE_INDEX file for efficient lookup in large mono-repos

### PACKAGE_INDEX Format (Optional)

For large mono-repos, you can create a `PACKAGE_INDEX` file in your repository root for faster package lookup:

```json
[
  {
    "name": "app",
    "location": "packages/app"
  },
  {
    "name": "core",
    "location": "packages/core"  
  },
  {
    "name": "features",
    "location": "features"
  }
]
```

Each entry should have:
- `name`: Package name (matches the name in pubspec.yaml)
- `location`: Relative path from repository root to the package directory

**Note**: If PACKAGE_INDEX is not present, the commands will automatically find packages by walking up the directory tree to find `pubspec.yaml` files. PACKAGE_INDEX is purely an optimization for large mono-repos.

### How It Works

1. When you run a `dart validate *` command without `--files`, it gets staged files by default
2. For each file, it finds the containing package:
   - If PACKAGE_INDEX exists: Uses it for fast lookup
   - Otherwise: Walks up the directory tree to find `pubspec.yaml`
3. It runs the validation command (format, analysis, etc.) on each affected package
4. This is much faster than validating the entire mono-repo

### Example Usage

```bash
# Validate formatting of affected packages (based on staged files)
tsutils dart validate format --verbose

# Validate specific files
tsutils dart validate format --files packages/app/lib/main.dart packages/core/lib/utils.dart --verbose

# Run analysis with auto-fix enabled
tsutils dart validate analysis --autofix --verbose

# Apply fixes to affected packages
tsutils dart fix --verbose

# Run all validations on affected packages
tsutils dart validate all --verbose

# Run analysis, skipping DCM
tsutils dart validate all --skip-dcm --verbose
```

## Project Structure

```
src/
├── cli.ts                       # CLI entry point
├── index.ts                     # Library exports
├── commands/                    # CLI commands
│   ├── git-check.ts             # Check if in git repo (exit code only)
│   ├── git-root.ts              # Get git root path (outputs path)
│   ├── git-changed.ts           # Show changed files
│   ├── git-branch.ts            # Get current branch name
│   ├── git-is-main.ts           # Check if on main branch
│   ├── git-commit-msg.ts        # Generate commit message using Claude
│   ├── git-pr-description.ts    # Generate PR description using Claude
│   ├── dart-check.ts            # Check if in Dart package
│   ├── dart-root.ts             # Get Dart package root
│   ├── dart-changed.ts          # Show changed Dart files
│   ├── dart-hook-format-check.ts # Format check for git hooks
│   ├── dart-hook-dcm-check.ts   # DCM fix check for git hooks
│   ├── dart-hook-graphql-check.ts # GraphQL codegen check for git hooks
│   ├── dart-validate-format.ts  # Validate Dart formatting
│   ├── dart-validate-analysis.ts # Validate Dart analysis (with --autofix)
│   ├── dart-validate-dcm.ts     # Validate DCM analysis
│   ├── dart-validate-freezed.ts # Validate freezed files
│   ├── dart-validate-all.ts     # Run all validation checks
│   ├── dart-fix.ts              # Apply Dart fixes
│   └── files-filter.ts          # Filter files by suffix
└── utils/                       # Utility functions
    ├── logger.ts
    ├── git.ts                   # Git utilities
    ├── dart.ts                  # Dart utilities (includes PACKAGE_INDEX support)
    └── files.ts                 # File utilities
```

[Contributing](CONTRIBUTING.md)

## License

MIT
