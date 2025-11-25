## Development

If you want to develop/contribute to it:

```bash
git clone https://github.com/bestdan/tsu.git
cd tsu
pnpm install
```

## Security Guidelines

Security is a top priority for this project. Please review our [Security Policy](SECURITY.md) before contributing.

### Secure Coding Practices

When contributing code:

1. **Never commit secrets**: No API keys, tokens, passwords, or credentials in code
2. **Validate all inputs**: Always validate and sanitize user inputs before use
3. **Use shell escaping**: When executing shell commands, use `escapeShellArg()` from `src/utils/shell.ts`
4. **Check dependencies**: Run `pnpm audit` before adding new dependencies
5. **Follow least privilege**: Request minimal permissions needed for functionality
6. **Review command execution**: Be extra careful with `execSync`, `spawn`, or `exec` calls
7. **Avoid eval**: Never use `eval()` or `Function()` constructor with user input
8. **Sanitize file paths**: Validate and sanitize file paths to prevent directory traversal

### Security Checklist for PRs

Before submitting a pull request:

- [ ] No secrets or credentials committed
- [ ] All user inputs are validated and sanitized
- [ ] Shell commands use proper escaping with `escapeShellArg()`
- [ ] No new dependencies with known vulnerabilities (`pnpm audit`)
- [ ] File paths are validated to prevent directory traversal
- [ ] Error messages don't leak sensitive information
- [ ] Tests cover security-critical code paths

### Reporting Security Issues

**Never report security vulnerabilities through public GitHub issues.**

Please see our [Security Policy](SECURITY.md) for instructions on how to report security issues privately.

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

## File Organization Guidelines

When creating or modifying code files:

- **Prefer one public class or top-level function per file**: Each file should focus on a single exported class or main function.
- **Private/helper methods may stay in the same file**: Methods that directly support the main class or function can remain co-located.
- **Avoid grouping unrelated classes or functions**: Don't combine multiple independent classes or functions in a single file just because they're in the same domain.
- **Favor clarity, discoverability, and single-responsibility**: File organization should make it easy to find and understand code. Each file should have a clear, focused purpose.
- **Use descriptive file names**: Name files after the primary class or function they contain (e.g., `find-dart-package-root.ts` for `findDartPackageRoot()`).

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
