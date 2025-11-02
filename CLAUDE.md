# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`tsutils` (aliased as `tsu`) is a TypeScript CLI utilities package focused on git operations and file manipulation. The package is designed with pipe-friendliness in mind, following Unix philosophy of composable, single-purpose tools. It can be used both as a CLI tool and as a library for programmatic use.

## Key Architecture Principles

### Dual-Purpose Design

The package exports both CLI commands (via `src/cli.ts`) and programmatic utilities (via `src/index.ts`). When adding features:

- CLI commands go in `src/commands/` and handle user interaction, output formatting, and exit codes
- Reusable utilities go in `src/utils/` and focus on pure logic without I/O
- Public APIs must be exported from `src/index.ts` for library consumers

### Pipe-Friendly Output Design

Commands follow strict I/O conventions for composability:

- **stdout**: Clean, parseable data only (one item per line, no decorations)
- **stderr**: Human-readable messages, errors, verbose output, headers
- **Exit codes**: 0 for success, non-zero for errors
- **--verbose flag**: All commands support this to enable human-readable context to stderr
- **Pass verbose through the stack**: When calling utility functions, pass the verbose flag down to ensure consistent debugging output

Examples:

- `git check`: Returns exit code only (no stdout). Use in conditionals: `tsu git check && echo "is repo"`
- `git root`: Outputs path to stdout. Use for navigation: `cd "$(tsu git root)"`
- `git changed`: Outputs filenames (one per line). With `--all`, prefixes with type (`committed:`, `staged:`, `unstaged:`)

### ESM Module System

This project uses native ESM (not CommonJS):

- Always use `.js` extensions in imports (TypeScript resolves to `.ts` during development)
- Use `import`/`export`, never `require()`
- Configure `"type": "module"` in package.json

## Development Commands

```bash
# Setup
pnpm install               # Install dependencies (pnpm is required)

# Development
pnpm build                 # Compile TypeScript to dist/
pnpm dev                   # Watch mode for development
pnpm typecheck             # Type check without emitting files

# Testing
pnpm test                  # Run tests in watch mode
pnpm test:run              # Run tests once (useful in CI)

# Code Quality
pnpm lint                  # Check for linting issues
pnpm lint:fix              # Auto-fix linting issues
pnpm format                # Format code with Prettier
pnpm format:check          # Check code formatting

# Local Testing
node dist/cli.js git check # Run CLI after building
# Or if globally linked: tsu git check
```

## Code Architecture

### Command Pattern

Commands in `src/commands/` follow a consistent pattern:

1. Accept options interface as parameter
2. Validate preconditions (e.g., `isGitRepo()`)
3. Use utilities from `src/utils/` for core logic
4. Output clean data to stdout
5. Send errors/verbose messages to stderr
6. Exit with appropriate code on errors

### Git Utilities (`src/utils/git.ts`)

Core git operations that all commands build upon:

- `isGitRepo(cwd?)`: Returns boolean, safe to call from anywhere
- `getGitRoot(cwd?)`: Returns absolute path or null
- `getChangedFiles(options)`: Returns array of file paths or null
  - `type`: 'committed' | 'staged' | 'unstaged'
  - `baseBranch`: For committed changes comparison (default: 'main')
  - `cwd`: Working directory override
- `getCurrentBranch(cwd?)`: Returns branch name or null

All functions handle errors gracefully and work from any subdirectory within a git repo.

### File Utilities (`src/utils/files.ts`)

- `filterFilesBySuffix(files, patterns)`: Removes files matching suffix patterns (e.g., `.g.dart`)
- Used by `files filter suffix` command for pipeline filtering

## Testing Strategy

- Tests live next to their implementation (e.g., `git.ts` → `git.test.ts`)
- Use Vitest with descriptive `describe`/`it` blocks
- Mock external dependencies (filesystem, git commands) to ensure reliability
- Test both success and error cases

## Adding New Commands

1. **Create command file** in `src/commands/new-command.ts`
2. **Implement command function** following the pipe-friendly pattern
3. **Register in CLI** at `src/cli.ts`:
   - Import the command function
   - Add to appropriate subcommand namespace (or create new one)
   - Use Commander.js `.command()`, `.description()`, `.option()`, `.action()`
4. **Add utility functions** to `src/utils/` if logic is reusable
5. **Export public APIs** from `src/index.ts` if utilities should be available to library consumers
6. **Write tests** in `src/commands/new-command.test.ts`
7. **Update documentation** appropriately (see Documentation Organization below)

## Documentation Organization

- **Avoid bloating README.md**: Keep the main README focused on essential information (installation, basic usage, key features)
- **Create topic-specific docs**: For detailed documentation on specific topics, create separate markdown files in a `docs/` directory (e.g., `docs/contributing.md`, `docs/architecture.md`)
- **Link from README**: Reference detailed documentation files from the main README when appropriate
- Keep documentation close to code when it's implementation-specific

## Git Commit Messages

- **Use Conventional Commits format**: Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for all commit messages
- Format: `<type>(<optional scope>): <description>`
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Examples:
  - `feat(git): add support for getting merge base`
  - `fix(cli): handle edge case in git root detection`
  - `docs: update README with new command examples`
  - `refactor(utils): extract common validation logic to ensureCondition`
  - `test(git): add tests for uncommitted changes`

## Important Coding Standards

### Internal Utilities

- **Use existing utilities**: Prefer internal utilities like `ensureCondition` from `src/utils/command-helpers.ts` for concise and consistent code
- **Create reusable utilities**: When implementing functionality that could be useful elsewhere, create shared utilities in `src/utils/`
- **Consolidate similar code**: Look for one-off code patterns that can be consolidated into reusable utilities
- **Export useful utilities**: If a utility would be helpful for library consumers, export it from `src/index.ts`
- Available key utilities:
  - `ensureCondition()`: Validate preconditions and exit with appropriate error messages
  - `displayChangedFiles()`: Generic function for displaying changed files with consistent formatting
  - `getChangedFilesWithOptions()`: Get changed files without displaying them

### TypeScript

- Use strict mode (configured in tsconfig.json)
- Avoid `any` types (lint warnings configured)
- **Avoid non-null assertions (`!`)**: Use proper error handling and type guards instead of TypeScript's non-null assertion operator. Prefer `ensureCondition` for validating preconditions.
- Export types for public APIs
- Target ES2022

### Code Style

- Follow Prettier configuration (2-space indentation, single quotes)
- Use camelCase for variables/functions, PascalCase for types, kebab-case for files
- ESLint enforces TypeScript best practices

### CLI Command Design

- Minimize external dependencies
- Keep commands focused (Unix philosophy)
- Commands should be composable and chainable
- Consider backwards compatibility when modifying existing commands
- All git commands work from any subdirectory within a repo
- **Pass verbose flag through**: When calling other functions or utilities that support verbose mode, pass the `--verbose` flag down the full stack for consistent debugging output

## Entry Points

- **CLI binary**: `src/cli.ts` → compiled to `dist/cli.js` (shebang included)
- **Library exports**: `src/index.ts` → compiled to `dist/index.js`
- **Package bins**: Both `tsutils` and `tsu` aliases point to `dist/cli.js`
