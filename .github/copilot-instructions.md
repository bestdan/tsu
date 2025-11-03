# GitHub Copilot Instructions for tsutils

## Project Overview

This is a TypeScript command-line utilities package that provides git-related utilities and CLI commands. The project uses modern TypeScript with ESM modules and follows a modular architecture.

## Technology Stack

- **Language**: TypeScript 5.9+ with ESM modules
- **Package Manager**: pnpm 9.0.0 (required)
- **CLI Framework**: Commander.js 14.x
- **Testing**: Vitest 4.0.6 and higher due to `/ignores` issues. 
- **Linting**: ESLint 9.x with TypeScript ESLint plugin
- **Code Formatting**: Prettier 3.x
- **Node Version**: >= 18.0.0

## Project Structure

```
src/
├── cli.ts              # CLI entry point with Commander.js
├── index.ts            # Library exports for programmatic use
├── commands/           # CLI command implementations
│   ├── git-check.ts    # Check if in git repo (exit code only)
│   ├── git-root.ts     # Get git root path (outputs to stdout)
│   └── git-changed.ts  # Show changed files
└── utils/              # Shared utility functions
    ├── logger.ts       # Logging utilities
    └── git.ts          # Git-related utilities
```

## Coding Standards

### Internal Utilities

- **Use existing utilities**: Prefer internal utilities like `ensureCondition` from `src/utils/command-helpers.ts` for concise and consistent code
- **Create reusable utilities**: When implementing functionality that could be useful elsewhere, create shared utilities in `src/utils/`
- **Consolidate similar code**: Look for one-off code patterns that can be consolidated into reusable utilities
- **Export useful utilities**: If a utility would be helpful for library consumers, export it from `src/index.ts`
- Available utilities include:
  - `ensureCondition()`: Validate preconditions and exit with appropriate error messages
  - `displayChangedFiles()`: Generic function for displaying changed files with consistent formatting
  - `getChangedFilesWithOptions()`: Get changed files without displaying them

### TypeScript

- Use strict TypeScript settings (see `tsconfig.json`)
- Prefer explicit types over `any` (lint warnings for `any`)
- Use ESM imports/exports (`import`/`export`, not `require`)
- Target ES2022 (as configured in tsconfig.json)
- Enable all strict type-checking options

### Code Style

- Use Prettier for formatting (configuration in `.prettierrc`)
- Follow ESLint rules (configuration in `eslint.config.js`)
- Use 2-space indentation
- Use single quotes for strings
- Add trailing commas in multi-line objects/arrays

### Naming Conventions

- Use camelCase for variables and functions
- Use PascalCase for types and interfaces
- Use kebab-case for file names
- Suffix test files with `.test.ts`

### Testing

- Write tests using Vitest
- Place test files next to the code they test (e.g., `git.ts` → `git.test.ts`)
- Use descriptive test names with `describe` and `it/test` blocks
- Test both success and error cases
- Mock external dependencies (like file system, git commands)

### CLI Commands Design Principles

- **Pipe-friendly output**: Commands should output clean, parseable data to stdout
- **Error handling**: Use stderr for errors and human-readable messages
- **Exit codes**: Use appropriate exit codes (0 for success, non-zero for errors)
- **Verbose mode**: Support `--verbose` flag for human-readable output to stderr
- **Pass verbose flag through**: When calling other functions or utilities that support verbose mode, pass the `--verbose` flag down the full stack for consistent debugging output
- Commands should:
  - Output parseable data to stdout (for piping)
  - Output errors/warnings to stderr
  - Return appropriate exit codes
  - Support `--verbose` for debugging
  - Pass `verbose` option to utility functions that support it

### Git Utilities

- Use the utilities in `src/utils/git.ts` for git operations
- Available functions:
  - `isGitRepo(path?)`: Check if directory is in a git repository
  - `getGitRoot(path?)`: Get the root directory of a git repository
  - `getChangedFiles(options)`: Get list of changed files
  - `getCurrentBranch(path?)`: Get current git branch name
- These utilities handle errors gracefully and return appropriate types

### Error Handling

- Use try-catch blocks for async operations
- Provide helpful error messages
- Log errors to stderr using the logger utility
- Exit with appropriate exit codes in CLI commands
- **Avoid non-null assertions (`!`)**: Use proper error handling and type guards instead of TypeScript's non-null assertion operator. Prefer `ensureCondition` for validating preconditions.

## Development Commands

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Development mode (watch)
pnpm dev

# Run tests
pnpm test          # Watch mode
pnpm test:run      # Run once

# Linting
pnpm lint          # Check for issues
pnpm lint:fix      # Auto-fix issues

# Formatting
pnpm format        # Format code
pnpm format:check  # Check formatting

# Type checking
pnpm typecheck     # Check types without building
```

## Adding New Commands

When creating a new CLI command:

1. Create a new file in `src/commands/` (e.g., `my-command.ts`)
2. Export a function that takes Commander's `Command` object
3. Add the command in `src/cli.ts` by importing and registering it
4. Create tests in `src/commands/my-command.test.ts`
5. If creating reusable utilities, add them to `src/utils/`
6. Export any public APIs from `src/index.ts`

Example command structure:

```typescript
import { Command } from 'commander';
import { logger } from '../utils/logger.js';

export function setupMyCommand(program: Command): void {
  program
    .command('mycommand')
    .description('Description of what this does')
    .option('-f, --flag', 'A flag option')
    .action(async (options) => {
      try {
        // Command implementation
      } catch (error) {
        logger.error('Error message', error);
        process.exit(1);
      }
    });
}
```

## Important Notes

- Always use `.js` extension in imports for ESM compatibility (TypeScript will resolve to `.ts`)
- The package exports both a CLI binary and a library
- All git commands should work from any subdirectory within a git repository
- Keep commands focused and composable (Unix philosophy)
- Consider backwards compatibility when modifying existing commands

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

## Dependencies

- Minimize external dependencies
- Use Node.js built-in modules when possible
- Document any new dependencies and their purpose
- Check security and maintenance status before adding dependencies
