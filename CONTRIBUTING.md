
## Development

If you want to develop/contribute to it: 

```bash
git clone https://github.com/bestdan/tsu.git
cd tsu
pnpm install
```

## Git Hooks (Lefthook)

This project uses [Lefthook](https://github.com/evilmartians/lefthook) to manage git hooks. After running `pnpm install`, the hooks will be automatically installed.

**Pre-push Hook:**
Before you push to the repository, the pre-push hook will automatically run:
- **Lint** - Check only changed TypeScript files for linting errors using `pnpm eslint`
- **Typecheck** - Verify TypeScript types only if TypeScript files changed using `pnpm typecheck`
- **Build** - Ensure the project builds successfully using `pnpm build`

These commands run in parallel to save time. If any of these checks fail, the push will be prevented.

To run in verbose mode, with dry-run
```bash
LEFTHOOK_VERBOSE=1 git push --dry-run
```

To bypass the hook in case of emergency (not recommended):
```bash
git push --no-verify
```

### Customizing Hooks Locally

You can skip specific checks by creating a `.lefthook-local.yml` file in the project root (this file is gitignored):

**Skip the build check:**
```yaml
# .lefthook-local.yml
pre-push:
  commands:
    build:
      skip: true
```

**Skip multiple checks:**
```yaml
# .lefthook-local.yml
pre-push:
  commands:
    build:
      skip: true
    typecheck:
      skip: true
```

**Enable verbose output:**
```bash
LEFTHOOK_VERBOSE=1 git push
```


Standard Typescript package commands: 

```bash
# Build the project
pnpm build

# Watch mode for development
pnpm dev

# Run tests
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage (enforces coverage threshold)
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

## Adding New Commands

1. Create a new file in `src/commands/`
2. Export your command function
3. Add it to `src/cli.ts`
4. Write tests in a `.test.ts` file
5. Export utilities from `src/index.ts` if needed

## Test Coverage

This project enforces test coverage for all code. Coverage checks are:

- **Runnable locally**: Use `pnpm test:coverage` to check coverage
- **Enforced in CI**: The GitHub Actions workflow includes a coverage job that will fail if coverage drops below the threshold
- **Coverage reports**: Generated in text, JSON, and HTML formats in the `coverage/` directory

Coverage thresholds are configured in `vitest.config.ts` and currently require:
- Statements: 77%
- Branches: 65%
- Functions: 77%
- Lines: 77%

The thresholds will be gradually increased as test coverage improves.

