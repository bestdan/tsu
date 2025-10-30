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
```

Or if you've linked the package globally (`pnpm link --global`):

```bash
tsutils git check
tsutils git root
tsutils git changed
tsutils git changed --staged
tsutils git changed --all
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
```

**Command Design for Piping:**
- **`git check`**: Returns exit code only (0=is git repo, 1=not). No stdout output. Perfect for conditionals.
- **`git root`**: Outputs the git root path to stdout. Perfect for `cd "$(tsutils git root)"`.
- **`git changed`**: Outputs filenames (one per line) to stdout. With `--all`, prefixes with type (`committed:`, `staged:`, `unstaged:`).
- **`--verbose`**: All commands support this flag to show human-readable headers/messages to stderr (won't interfere with piping).

### Available Utilities

You can also import utilities directly in your TypeScript/JavaScript projects:

```typescript
import { isGitRepo, getGitRoot, getChangedFiles, getCurrentBranch } from 'tsutils';

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
```

## Project Structure

```
src/
├── cli.ts              # CLI entry point
├── index.ts            # Library exports
├── commands/           # CLI commands
│   ├── git-check.ts    # Check if in git repo (exit code only)
│   ├── git-root.ts     # Get git root path (outputs path)
│   └── git-changed.ts  # Show changed files
└── utils/              # Utility functions
    ├── logger.ts
    ├── git.ts          # Git utilities (isGitRepo, getGitRoot, getChangedFiles, getCurrentBranch)
    └── git.test.ts
```

## Adding New Commands

1. Create a new file in `src/commands/`
2. Export your command function
3. Add it to `src/cli.ts`
4. Write tests in a `.test.ts` file
5. Export utilities from `src/index.ts` if needed

## License

MIT
