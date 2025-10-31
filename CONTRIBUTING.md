
## Development

If you want to develop/contribute to it: 

```bash
git clone https://github.com/bestdan/tsu.git
cd tsu
pnpm install
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

