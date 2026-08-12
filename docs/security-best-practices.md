# Security Best Practices

This document outlines security best practices for both contributors and users of tsu.

## For Contributors

### 1. Secure Coding Guidelines

#### Input Validation

Always validate and sanitize user inputs:

```typescript
import { safeShellArg, isSafeShellInput } from '../utils/shell.js';

// Good: Validate before use
function processFile(filename: string) {
  if (!isSafeShellInput(filename)) {
    throw new Error('Invalid filename');
  }
  execSync(`cat ${safeShellArg(filename)}`);
}

// Bad: No validation
function processFile(filename: string) {
  execSync(`cat ${filename}`); // Vulnerable to injection!
}
```

#### Shell Command Execution

When executing shell commands:

1. **Always escape arguments**: Use `escapeShellArg()` or `safeShellArg()`
2. **Validate inputs**: Use `isSafeShellInput()` for additional safety
3. **Avoid string concatenation**: Use parameterized execution when possible
4. **Never use user input directly in shell commands**

```typescript
import { execSync } from 'node:child_process';
import { escapeShellArg } from '../utils/shell.js';

// Good: Escaped arguments
const safeFile = escapeShellArg(userInput);
execSync(`git add ${safeFile}`);

// Bad: Unescaped user input
execSync(`git add ${userInput}`); // NEVER DO THIS!

// Best: Use array syntax when available
import { spawn } from 'node:child_process';
spawn('git', ['add', userInput]); // Arguments are automatically escaped
```

#### File Path Validation

Validate file paths to prevent directory traversal:

```typescript
import { resolve, normalize } from 'node:path';

function validatePath(userPath: string, baseDir: string): string {
  const resolvedPath = resolve(baseDir, normalize(userPath));
  
  // Ensure the resolved path is within baseDir
  if (!resolvedPath.startsWith(resolve(baseDir))) {
    throw new Error('Path traversal attempt detected');
  }
  
  return resolvedPath;
}
```

#### Secret Management

**Never commit secrets:**

- API keys
- Tokens
- Passwords
- Private keys
- Environment variables containing sensitive data

```typescript
// Good: Read from environment
const apiKey = process.env.API_KEY;

// Bad: Hardcoded secret
const apiKey = 'sk-1234567890abcdef'; // NEVER DO THIS!
```

Use `.gitignore` to exclude files containing secrets:
```
.env
.env.local
.env.*.local
```

### 2. Code Review Checklist

Before submitting a PR, verify:

- [ ] No secrets or credentials in code or git history
- [ ] All user inputs are validated
- [ ] Shell commands use `escapeShellArg()` or `safeShellArg()`
- [ ] File paths are validated against directory traversal
- [ ] No use of `eval()` or `Function()` constructor
- [ ] Dependencies checked with `pnpm audit`
- [ ] Error messages don't leak sensitive information
- [ ] Tests cover security-critical code paths

### 3. Dependency Management

#### Adding Dependencies

Before adding a new dependency:

1. **Check for vulnerabilities**: Run `pnpm audit`
2. **Verify the package**: Check npm page, GitHub repo, download counts
3. **Review the code**: Look for suspicious code if the package is small
4. **Check maintenance**: Ensure it's actively maintained
5. **Consider alternatives**: Prefer well-known, widely-used packages

```bash
# Check for vulnerabilities
pnpm audit

# Add the dependency
pnpm add package-name

# Verify no new vulnerabilities
pnpm audit
```

#### Updating Dependencies

Regularly update dependencies to patch security issues:

```bash
# Update all dependencies
pnpm update

# Check for vulnerabilities
pnpm audit

# Auto-fix vulnerabilities where possible
pnpm audit --fix
```

### 4. Error Handling

Don't leak sensitive information in error messages:

```typescript
// Good: Generic error message
catch (error) {
  console.error('Authentication failed');
  process.exit(1);
}

// Bad: Leaks sensitive info
catch (error) {
  console.error(`Failed to authenticate with token: ${apiToken}`); // Don't do this!
}
```

### 5. TypeScript Security

Use TypeScript features to enhance security:

```typescript
// Use strict types
type SafeFilename = string & { __brand: 'SafeFilename' };

function validateFilename(name: string): SafeFilename {
  if (!isSafeShellInput(name)) {
    throw new Error('Invalid filename');
  }
  return name as SafeFilename;
}

function processFile(name: SafeFilename) {
  // TypeScript ensures name is validated
  execSync(`cat ${escapeShellArg(name)}`);
}

// Usage
const filename = validateFilename(userInput);
processFile(filename);
```

## For Users

### 1. Installation Security

Install from trusted sources only:

```bash
# Good: Official repository
pnpm add -g github:bestdan/tsu

# Or using npm
npm install -g github:bestdan/tsu

# Verify checksums if available
# Check package signatures
```

### 2. Update Regularly

Keep tsu updated to receive security patches:

```bash
# Check current version against latest
tsu check version

# Upgrade to latest version
tsu upgrade
```

### 3. Permissions

Review what permissions the tool requires:

- File system access (read/write in your repository)
- Git command execution
- External tool execution (Dart, DCM, Claude CLI, etc.)

### 4. Trust Boundary

Understand that tsu executes:
- Git commands
- Dart SDK commands (if installed)
- DCM (if installed)
- Claude CLI (if installed)

Only use in repositories and environments you trust.

### 5. Review Configuration

Before running git hooks or automated tools:

1. Review the hook configuration
2. Understand what commands will run
3. Test in a safe environment first

## Security Tools

### Static Analysis

We use several tools to maintain security:

```bash
# TypeScript type checking
pnpm typecheck

# ESLint for code quality
pnpm lint

# Security audit
pnpm audit
```

### CI/CD Security

Our CI pipeline includes:

- **CodeQL**: Security code scanning
- **Dependency scanning**: Automated vulnerability detection via Dependabot
- **Security audits**: Regular pnpm audit checks
- **Pinned actions**: GitHub Actions pinned to specific SHAs

## Incident Response

If you discover a security issue:

1. **Do not** open a public issue
2. Report via [GitHub Security Advisories](https://github.com/bestdan/tsu/security/advisories)
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

See [SECURITY.md](../SECURITY.md) for full reporting guidelines.

## Resources

- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)

## Security Updates

This document is regularly updated. Last updated: 2025-11-25
