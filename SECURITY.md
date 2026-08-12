# Security Policy

## Supported Versions

We release patches for security vulnerabilities. Currently supported versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.9.x   | :white_check_mark: |
| < 0.9   | :x:                |

## Reporting a Vulnerability

We take the security of tsu seriously. If you believe you have found a security vulnerability, please report it to us privately.

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via GitHub's private vulnerability reporting:

1. Navigate to the [Security Advisories](https://github.com/bestdan/tsu/security/advisories) page
2. Click "Report a vulnerability"
3. Provide details about the vulnerability

Alternatively, you can email the maintainers directly.

### What to Include

Please include the following information in your report:

- Type of vulnerability (e.g., command injection, dependency vulnerability, etc.)
- Full paths of source file(s) related to the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 7 days
- **Fix Timeline**: Varies by severity
  - Critical: Within 7 days
  - High: Within 30 days
  - Medium/Low: Next scheduled release

## Security Best Practices

### For Contributors

When contributing to this project:

1. **Never commit secrets**: API keys, tokens, passwords, or other credentials
2. **Validate inputs**: Always validate and sanitize user inputs
3. **Use shell escaping**: When executing shell commands, use `escapeShellArg()` from `src/utils/shell.ts`
4. **Review dependencies**: Check for known vulnerabilities before adding new dependencies
5. **Follow least privilege**: Request minimal permissions needed
6. **Keep dependencies updated**: Regularly update dependencies to patch security issues

### For Users

When using tsu:

1. **Keep updated**: Always use the latest stable version
2. **Review permissions**: Understand what permissions the tool requires
3. **Verify installation**: Install from official sources only
4. **Use in trusted environments**: Run in environments you control
5. **Report issues**: Report any suspicious behavior

## Security Features

### Command Injection Prevention

This project includes protection against command injection:

- All shell arguments are escaped using `escapeShellArg()` utility
- User inputs are validated before being passed to shell commands
- File paths are resolved to prevent directory traversal

### Error Logging

The project includes a local error logging system that respects user privacy:

- **Local only**: All logs are stored locally on the user's machine
- **Opt-out**: Enabled by default but can be disabled via `TSU_ERROR_LOG=false`
- **Privacy protection**: Automatically sanitizes sensitive data:
  - Replaces home directory paths with `~`
  - Redacts patterns that look like secrets (API keys, tokens)
- **No external transmission**: Error logs never leave the user's machine
- **Transparent**: Clear documentation of what is logged and where

See [Error Logging Documentation](docs/error-logging.md) for details.

### Dependency Security

- Minimal runtime dependencies (only `commander`)
- Regular dependency updates
- Automated security scanning (planned)

### Code Security

- TypeScript strict mode enabled
- ESLint security rules enforced
- Regular code reviews
- Automated testing with high coverage (>94%)

## Known Security Considerations

### External Command Execution

This tool executes external commands including:
- Git commands
- Dart SDK commands (format, analyze)
- DCM (Dart Code Metrics)
- Claude CLI
- Melos

**Risk Mitigation**:
- Commands are executed with escaped arguments
- File paths are validated
- External tools are optional and clearly documented
- Users must explicitly install external dependencies

### File System Access

This tool reads and modifies files in your repository:
- Git repository operations
- Dart source file analysis
- Configuration file reading

**Risk Mitigation**:
- Operations are scoped to current repository
- No external network access except for package updates
- Clear documentation of file system operations

### GitHub Actions Security

Our CI/CD workflows follow security best practices:
- Minimal required permissions per job
- No third-party actions with write access
- Secrets managed through GitHub Secrets
- Actions should be pinned to commit SHAs (improvement in progress)

## Security Update Process

When a security vulnerability is identified:

1. **Assessment**: Evaluate severity and impact
2. **Fix Development**: Develop and test fix in private
3. **Advisory**: Create GitHub Security Advisory
4. **Release**: Release patched version
5. **Notification**: Notify users via:
   - GitHub Security Advisories
   - Release notes
   - README update (for critical issues)
6. **Public Disclosure**: After fix is available and users have time to update

## Security Tools

We use the following tools to maintain security:

- **TypeScript**: Type safety to prevent common errors
- **ESLint**: Static code analysis
- **Vitest**: Comprehensive test coverage
- **GitHub Dependabot**: Dependency vulnerability scanning (planned)
- **CodeQL**: Security code scanning (planned)

## Acknowledgments

We thank security researchers and users who responsibly disclose vulnerabilities to help keep this project secure.

## Contact

For security concerns that don't require immediate attention, you can also open a discussion in the repository's Discussions section with the "security" label.

## Additional Resources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Secure Coding Practices](https://owasp.org/www-project-secure-coding-practices-quick-reference-guide/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
