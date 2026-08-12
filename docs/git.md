# Git Commands

Git-related utilities for working with git repositories.

## Available Commands

```bash
tsu git check              # Check if in a git repository (exit code only)
tsu git root               # Get git root path
tsu git changed            # Show changed files
tsu git changed --staged   # Show only staged files
tsu git changed --all      # Show all changes with status prefix
tsu git branch             # Get current branch name
tsu git is-main            # Check if on main branch
tsu git commit-msg         # Generate commit message using Claude CLI
tsu git pr-description     # Generate PR description using Claude CLI
tsu git codeowners check   # Check if CODEOWNERS files are in sync
```

## Pipe-Friendly Output

All git commands output clean, parseable data to **stdout** by default, making them perfect for piping and chaining with other commands:

```bash
# Boolean checks with git check (exit code only, no output)
if tsu git check; then
  echo "This is a git repository"
fi

tsu git check && echo "In a git repo" || echo "Not a git repo"

# Get git root and cd into it
cd "$(tsu git root)"

# Count changed files
tsu git changed | wc -l

# Filter only staged files from all changes
tsu git changed --all | grep "^staged:" | cut -d: -f2

# Process each changed file
tsu git changed | xargs -I {} echo "Processing: {}"

# Get just the file extensions of changed files
tsu git changed | xargs -n1 basename | grep -o '\.[^.]*$' | sort | uniq

# Use with other git commands
tsu git changed --staged | xargs git reset

# Pipe to other tools
tsu git changed | fzf | xargs code

# Combine git check and git root
tsu git check && cd "$(tsu git root)" && echo "Moved to $(pwd)"

# Generate commit message and pipe to git commit
tsu git commit-msg | git commit -F -

# Generate commit message and review in editor before committing
tsu git commit-msg > /tmp/commit-msg.txt && vim /tmp/commit-msg.txt && git commit -F /tmp/commit-msg.txt

# Generate PR description and copy to clipboard (macOS)
tsu git pr-description | pbcopy

# Generate PR description and save to file
tsu git pr-description > pr-description.md

# Use PR description with gh CLI to create PR
gh pr create --title "Feature: $(git branch --show-current)" --body "$(tsu git pr-description)"
```

## Command Details

### `git check`

Returns exit code only (0=is git repo, 1=not). No stdout output. Perfect for conditionals.

### `git root`

Outputs the git root path to stdout. Perfect for `cd "$(tsu git root)"`.

### `git changed`

Outputs filenames (one per line) to stdout. With `--all`, prefixes with type (`committed:`, `staged:`, `unstaged:`).

### `git branch`

Outputs the current git branch name to stdout.

### `git is-main`

Checks if the current branch is the main branch. Returns exit code only (0=is main, 1=not main).

### `git commit-msg`

Generates a commit message from staged changes using Claude CLI. Outputs message to stdout for piping, or use `--commit` to auto-commit.

**Requirements**: Claude CLI must be installed. Get it from https://github.com/anthropics/claude-cli

### `git pr-description`

Generates a GitHub PR description from branch changes using Claude CLI. Outputs markdown description to stdout. Compares current branch to main (or `--base-branch`).

**Requirements**: Claude CLI must be installed. Get it from https://github.com/anthropics/claude-cli

### `git codeowners check`

Checks if CODEOWNERS files are in sync by running `coach codeowners generate` and verifying no files changed. Also checks for unowned files using `coach codeowners unowned --check`. Returns exit code only (0=all checks pass, 1=checks fail). Perfect for CI/CD pipelines.

**Requirements**: `coach` CLI must be installed.

## Verbose Mode

All commands support the `--verbose` flag to show human-readable headers/messages to stderr (won't interfere with piping).
