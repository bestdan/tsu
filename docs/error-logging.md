# Error Logging and Diagnostics

## Overview

tsu includes a local error logging system designed for open-source CLI tools. This system helps users and maintainers diagnose issues while respecting user privacy.

## Key Features

- **Local-only**: All error logs are stored locally on your machine
- **Privacy-focused**: Sanitizes error messages to remove sensitive data
- **Enabled by default**: Can be easily disabled via environment variable
- **No external services**: No data is sent to external servers or tracking services
- **Transparent**: Clear documentation of what is logged

## Configuration

### Disable Error Logging

If you prefer not to have errors logged locally, you can disable error logging:

```bash
# Disable for a single command
TSU_ERROR_LOG=false tsu git changed

# Disable globally in your shell profile
export TSU_ERROR_LOG=false
```

### Custom Log Directory

By default, error logs are stored in `~/.tsu/logs/`. You can customize this location:

```bash
# Use a custom directory
export TSU_LOG_DIR=/path/to/custom/logs
```

## What Gets Logged

When an error occurs, the following information is recorded in `~/.tsu/logs/errors.log`:

- **Timestamp**: When the error occurred
- **Version**: The version of tsu you're running
- **Node Version**: Your Node.js version
- **Platform**: Your operating system (linux, darwin, win32, etc.)
- **Command**: The command that was executed
- **Working Directory**: Your current working directory (with `~` replacing home directory)
- **Error Message**: The error message (sanitized)
- **Stack Trace**: The error stack trace (sanitized, if available)

### Privacy Protection

The error logger automatically sanitizes logged data to protect your privacy:

- **Paths**: Your home directory is replaced with `~` to prevent leaking your username
- **Secrets**: Patterns that look like API keys, tokens, or passwords are redacted as `[REDACTED]`
- **No network data**: No information is sent over the network

## Log File Location

Error logs are stored at:

```
~/.tsu/logs/errors.log
```

You can find your exact log file location by running:

```bash
echo ~/.tsu/logs/errors.log
```

## Log File Format

Each error entry in the log file looks like this:

```
---
Timestamp: 2025-12-28T16:00:00.000Z
Version: 0.15.0
Node: v20.19.5
Platform: linux
Command: tsu git changed
CWD: ~/projects/my-app
Error: git command failed: not a git repository
Stack:
Error: git command failed: not a git repository
    at gitCheck (~/projects/tsu/dist/commands/git/check.js:10:15)
    at Command.action (~/projects/tsu/dist/cli.js:83:5)

```

## Viewing Error Logs

To view recent errors:

```bash
# View the entire log file
cat ~/.tsu/logs/errors.log

# View the last 50 lines
tail -n 50 ~/.tsu/logs/errors.log

# View errors from today
grep "$(date +%Y-%m-%d)" ~/.tsu/logs/errors.log
```

## Clearing Error Logs

If you want to clear your error logs:

```bash
# Clear all logs
rm ~/.tsu/logs/errors.log

# Or clear the entire logs directory
rm -rf ~/.tsu/logs/
```

## Reporting Issues

If you encounter a bug or error:

1. **Check existing issues**: Visit [GitHub Issues](https://github.com/bestdan/tsu/issues) to see if it's already reported
2. **Gather information**: Review your error log at `~/.tsu/logs/errors.log`
3. **Create an issue**: If it's a new issue, open a GitHub issue with:
   - The command you ran
   - The error message
   - Relevant parts of your error log (sanitized automatically)
   - Your environment (from the log: version, node version, platform)

### What to Include

When reporting an issue, include the relevant error log entry. The log is already sanitized, but you should still review it to ensure no sensitive information is included:

```bash
# Get the last error entry
tail -n 15 ~/.tsu/logs/errors.log
```

**Please review the log entry and remove any additional sensitive information before sharing.**

## Troubleshooting

### Error logging not working

1. Check if it's disabled:
   ```bash
   echo $TSU_ERROR_LOG
   ```
   If this prints "false", error logging is disabled.

2. Check directory permissions:
   ```bash
   ls -la ~/.tsu/
   ```
   Ensure you have write permissions to the directory.

3. Try with a custom directory:
   ```bash
   mkdir -p /tmp/tsu-logs
   TSU_LOG_DIR=/tmp/tsu-logs tsu git changed
   ls /tmp/tsu-logs/
   ```

### Log file too large

Error logs are appended to the same file. If the log file becomes too large:

```bash
# Check log file size
du -h ~/.tsu/logs/errors.log

# Archive old logs
mv ~/.tsu/logs/errors.log ~/.tsu/logs/errors-$(date +%Y%m%d).log

# Or simply delete
rm ~/.tsu/logs/errors.log
```

## For Contributors

If you're contributing to tsu and want to add error logging to new commands:

```typescript
import { logError } from '../utils/error-logger.js';

try {
  // Your command logic
} catch (error) {
  // Log the error for diagnostics
  logError(error, 'tsu command-name');
  
  // Display user-friendly error message
  console.error('Error: Something went wrong');
  process.exit(1);
}
```

See [CONTRIBUTING.md](../CONTRIBUTING.md) for more details on adding error logging to commands.

## Privacy and Security

### What is NOT logged

- User credentials or tokens
- API keys or secrets
- Full file contents
- Network requests or responses
- Personal identifiable information (PII)

### What IS logged

- Command-line arguments (already visible in your shell history)
- Error messages (sanitized)
- File paths (with home directory replaced by `~`)
- System information (Node version, platform)

### Why Local Logging?

For an open-source CLI tool, local logging provides several benefits:

1. **User Control**: You control your data and can delete logs anytime
2. **Privacy**: No data leaves your machine
3. **Transparency**: You can inspect logs to see exactly what's recorded
4. **No dependencies**: No external services or API keys required
5. **Works offline**: Logging works without internet connection

### Comparison to Cloud Services

Unlike cloud-based error tracking services (like Datadog, Sentry, etc.):

- ✅ **No account required**: No sign-up or registration
- ✅ **No data sharing**: Your error data stays on your machine
- ✅ **No costs**: Completely free, no usage limits
- ✅ **No tracking**: No user tracking or analytics
- ✅ **Works offline**: No internet connection needed
- ❌ **Manual reporting**: You need to manually share logs when reporting issues
- ❌ **No aggregation**: Can't see patterns across multiple users
- ❌ **No real-time alerting**: Maintainers aren't notified of errors

For an open-source CLI tool, the privacy and simplicity benefits outweigh the limitations of local-only logging.

## Further Reading

- [SECURITY.md](../SECURITY.md) - Security policy and practices
- [CONTRIBUTING.md](../CONTRIBUTING.md) - Contributing guidelines
- [GitHub Issues](https://github.com/bestdan/tsu/issues) - Report bugs and issues
