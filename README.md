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

```bash
pnpm install
```

## Development

```bash
# Build the project
pnpm build

# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage (enforces 100% coverage threshold)
pnpm test:coverage

# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check

# Type check without emitting
pnpm typecheck
```

## Usage

After building, you can run the CLI:

```bash
# Check if current directory is in a git repository (exit code only)
node dist/cli.js git check

# Check if a specific path is in a git repository (exit code only)
node dist/cli.js git check /path/to/directory

# Get the git root directory (outputs path to stdout)
node dist/cli.js git root

# Get the git root of a specific path
node dist/cli.js git root /path/to/directory

# Show files changed compared to main branch (default)
node dist/cli.js git changed

# Show files changed compared to a specific branch
node dist/cli.js git changed --base-branch develop

# Show only staged changes
node dist/cli.js git changed --staged

# Show only unstaged changes
node dist/cli.js git changed --unstaged

# Show all changes (committed, staged, and unstaged)
node dist/cli.js git changed --all

# Add --verbose flag to see human-readable headers (output to stderr)
node dist/cli.js git changed --verbose
node dist/cli.js git check --verbose

# Generate a commit message from staged changes using Claude
node dist/cli.js git commit-msg

# Generate and automatically create the commit
node dist/cli.js git commit-msg --commit

# Generate with verbose output
node dist/cli.js git commit-msg --verbose

# Generate a PR description from branch changes using Claude
node dist/cli.js git pr-description

# Generate PR description comparing to a different base branch
node dist/cli.js git pr-description --base-branch develop

# Generate with verbose output
node dist/cli.js git pr-description --verbose
```

Or if you've linked the package globally (`pnpm link --global`):

```bash
tsutils git check
tsutils git root
tsutils git changed
tsutils git changed --staged
tsutils git changed --all
tsutils git commit-msg
tsutils git pr-description
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
- **`--verbose`**: All commands support this flag to show human-readable headers/messages to stderr (won't interfere with piping).

### Available Utilities

You can also import utilities directly in your TypeScript/JavaScript projects:

```typescript
import {
  isGitRepo,
  getGitRoot,
  getChangedFiles,
  getCurrentBranch,
  getStagedDiff,
  getBranchDiff,
  isMainBranch,
  generateCommitMessage,
  generatePRDescription,
  createCommit
} from 'tsutils';

// Check if current directory is in a git repo
if (isGitRepo()) {
  console.log('Git root:', getGitRoot());
}

// Check a specific directory
if (isGitRepo('/some/path')) {
  console.log('It is a git repo!');
}

// Get current branch name
const branch = getCurrentBranch();
console.log('Current branch:', branch);

// Get committed changes compared to main
const committedFiles = getChangedFiles({ type: 'committed', baseBranch: 'main' });
console.log('Changed files:', committedFiles);

// Get staged changes
const stagedFiles = getChangedFiles({ type: 'staged' });
console.log('Staged files:', stagedFiles);

// Get unstaged changes
const unstagedFiles = getChangedFiles({ type: 'unstaged' });
console.log('Unstaged files:', unstagedFiles);

// Get staged diff
const diff = getStagedDiff();
if (diff) {
  console.log('Staged diff:', diff);
}

// Get branch diff
const branchDiff = getBranchDiff('main');
if (branchDiff) {
  console.log('Changes since main:', branchDiff);
}

// Check if on main branch
if (isMainBranch('main')) {
  console.log('Currently on main branch');
}

// Generate commit message from staged changes (requires Claude CLI)
const message = generateCommitMessage();
if (message) {
  console.log('Generated message:', message);

  // Create the commit
  const success = createCommit({ message });
  if (success) {
    console.log('Commit created!');
  }
}

// Generate PR description from branch changes (requires Claude CLI)
if (!isMainBranch('main')) {
  const prDescription = generatePRDescription({ baseBranch: 'main' });
  if (prDescription) {
    console.log('PR Description:', prDescription);
  }
}
```

## Requirements

- **Node.js**: >=18.0.0
- **Claude CLI**: Required for `git commit-msg` command. Install from https://github.com/anthropics/claude-cli

## Project Structure

```
src/
├── cli.ts                 # CLI entry point
├── index.ts               # Library exports
├── commands/                 # CLI commands
│   ├── git-check.ts          # Check if in git repo (exit code only)
│   ├── git-root.ts           # Get git root path (outputs path)
│   ├── git-changed.ts        # Show changed files
│   ├── git-branch.ts         # Get current branch name
│   ├── git-is-main.ts        # Check if on main branch
│   ├── git-commit-msg.ts     # Generate commit message using Claude
│   └── git-pr-description.ts # Generate PR description using Claude
└── utils/                 # Utility functions
    ├── logger.ts
    ├── git.ts             # Git utilities
    └── git.test.ts
```

## Adding New Commands

1. Create a new file in `src/commands/`
2. Export your command function
3. Add it to `src/cli.ts`
4. Write tests in a `.test.ts` file
5. Export utilities from `src/index.ts` if needed

## Test Coverage

This project enforces 100% test coverage for all code. Coverage checks are:

- **Runnable locally**: Use `pnpm test:coverage` to check coverage
- **Enforced in CI**: The GitHub Actions workflow includes a coverage job that will fail if coverage drops below 100%
- **Coverage reports**: Generated in text, JSON, and HTML formats in the `coverage/` directory

Coverage thresholds are configured in `vitest.config.ts` and require 100% coverage for:
- Statements
- Branches
- Functions
- Lines

## License

MIT
