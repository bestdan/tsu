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
- **`--verbose`**: All commands support this flag to show human-readable headers/messages to stderr (won't interfere with piping).

## Requirements

- **Node.js**: >=22.0.0
- **Claude CLI**: Required for `git commit-msg` and `git pr-description` commands. Install from https://github.com/anthropics/claude-cli
- **DCM**: Optional for `dart hook dcm check` command. Install from https://dcm.dev
- **Dart SDK**: Required for `dart hook format check` command. Install from https://dart.dev
- **Melos**: Required for `dart hook graphql check` command. Install from https://melos.invertase.dev

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
│   └── files-filter.ts          # Filter files by suffix
└── utils/                       # Utility functions
    ├── logger.ts
    ├── git.ts                   # Git utilities
    ├── dart.ts                  # Dart utilities
    └── files.ts                 # File utilities
```

[Contributing](CONTRIBUTING.md)

## License

MIT
