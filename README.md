# tsutils

TypeScript command line utilities package.

## Installation

Clone and biuld

```sh
git clone https://github.com/bestdan/tsu.git
cd tsu
chmod +x script/setup.sh
sh script/setup.sh
```

## Usage

```sh
tsu <namespace> <command> [options]
```

## Git hook

To use tsu to check your dart changes before pushing, create a `pre-push` hook in your `.git/hooks` directory:

```sh
cd ~/src/mobile
cat > .git/hooks/pre-push << 'EOF'
#!/bin/bash

# Enable pipefail so pipe failures are captured properly
set -o pipefail

echo "📋 Running pre-push tsu checks"
tsu hook collate --with-config  # Uses config file for timeout settings
# tsu hook collate --verbose # If you want verbose output
EOF

chmod +x .git/hooks/pre-push
```

### Configuration File

Create a `.tsurc` file in your project root to customize timeout settings:

```json
{
  "timeout": 5000,
  "hook": {
    "collate": {
      "timeout": 20000,
      "checks": {
        "dart-format": { "timeout": 3000 },
        "dart-analysis": { "timeout": 15000 },
        "dcm-analyze": { "timeout": 10000 }
      }
    }
  }
}
```

See `templates/.tsurc.example` for a complete example.

### Available Namespaces

- **check** - System dependency checks ([documentation](docs/check.md))
- **upgrade** - Check for newer versions ([documentation](docs/upgrade.md))
- **git** - Git-related utilities ([documentation](docs/git.md))
- **dart** - Dart/Flutter project utilities ([documentation](docs/dart.md))
- **hook** - Git / Claude hook utilities for Dart ([documentation](docs/hook.md))
- **files** - File filtering utilities ([documentation](docs/files.md))

### Top-level Commands

```bash
# Run all checks concurrently, collate results
tsu hook format --verbose

# Check and upgrade tsutils
tsutils check version --verbose
tsutils upgrade --verbose

# Check external dependencies
tsutils check externals --verbose

# Check if in a git repository
tsutils git check && echo "In a git repo"

# Get git root path
cd "$(tsutils git root)"

# Show changed files
tsutils git changed

# Format check for Dart files (git hook)
tsutils hook format check

# Filter files by extension
tsutils git changed | tsutils files filter --suffix .ts
```

### Command Design Philosophy

All commands follow a **pipe-friendly** design:

- Clean, parseable output to **stdout**
- Error messages to **stderr**
- Appropriate exit codes
- `--verbose` flag for debugging (outputs to stderr)

## Requirements

- **Node.js**: >=20.0.0

### Developer

- **Vitest**: >=4.0.6 // for proper ignores in test coverage

### Optional Dependencies

Some commands require additional tools:

- **Claude CLI**: For `git commit-msg` and `git pr-description` - [Install](https://github.com/anthropics/claude-cli)
- **Dart SDK**: For `dart` commands - [Install](https://dart.dev)
- **DCM**: For `hook dcm check` - [Install](https://dcm.dev)
- **Melos**: For `hook graphql check` - [Install](https://melos.invertase.dev)

See the [git docs](docs/git.md) and [dart docs](docs/dart.md) for details on which commands need what.

## Project Structure

```
src/
├── cli.ts                       # CLI entry point
├── index.ts                     # Library exports
├── commands/                    # CLI commands
│   ├── git/                     # Git namespace commands
│   ├── dart/                    # Dart namespace commands
│   └── files/                   # Files namespace commands
└── utils/                       # Utility functions
    ├── logger.ts
    ├── git.ts                   # Git utilities
    ├── dart.ts                  # Dart utilities
    └── files.ts                 # File utilities
```

## Error Logging and Diagnostics

tsutils includes a **privacy-focused local error logging system** to help diagnose issues:

- 🔒 **Local-only**: All error logs stay on your machine
- 🛡️ **Privacy-first**: Automatically sanitizes sensitive data
- ⚙️ **Configurable**: Easy to disable or customize
- 📝 **Transparent**: See exactly what gets logged

See [Error Logging Documentation](docs/error-logging.md) for details on:
- How to disable error logging
- What information is logged
- How to report issues
- Privacy and security considerations

## Development

- [Contributing Guide](CONTRIBUTING.md)
- [Release Management](docs/release.md) - Automated versioning and releases

## Security

- **Security Policy**: See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities
- **Automated Scanning**: CodeQL security scanning runs on every PR and weekly
- **Dependency Monitoring**: Dependabot monitors dependencies for known vulnerabilities
- **Minimal Dependencies**: Only one runtime dependency (`commander`)
- **Regular Updates**: Dependencies are regularly updated to patch security issues
- **Code Reviews**: All changes undergo security-focused code review

### Reporting Security Issues

**Please do not report security vulnerabilities through public GitHub issues.**

Report security issues privately via [GitHub Security Advisories](https://github.com/bestdan/tsu/security/advisories) or see our [Security Policy](SECURITY.md) for details.

## License

MIT
