# tsutils

TypeScript command line utilities package.

## Installation

For straight usage:

```bash
# Using npm:
npm install -g github:bestdan/tsu

# Using pnpm:
pnpm add -g github:bestdan/tsu

# Using yarn:
yarn global add github:bestdan/tsu
```

After building, link the package globally

```bash
pnpm link --global
```

## Usage

```bash
tsutils <namespace> <command> [options]
tsu <namespace> <command> [options]
```

### Available Namespaces

- **check** - System dependency checks ([documentation](docs/check.md))
- **git** - Git-related utilities ([documentation](docs/git.md))
- **dart** - Dart/Flutter project utilities ([documentation](docs/dart.md))
- **hook** - Git / Claude hook utilities for Dart ([documentation](docs/hook.md))
- **files** - File filtering utilities ([documentation](docs/files.md))

### HK Integration

TSU provides seamless integration with [HK](https://github.com/jdx/hk), a high-performance git hook manager that runs hooks in parallel. See the [HK integration guide](docs/hk.md) for setup instructions and benefits.

**Prerequisites:** Install TSU and HK first (see [HK docs](docs/hk.md) for details)

Quick setup:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/bestdan/tsu/main/scripts/setup-hk.sh | bash
```

### Top-level Commands

- **upgrade** - Upgrade tsutils to the latest version from GitHub ([documentation](docs/upgrade.md))

### Quick Examples

```bash
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

- **Node.js**: >=22.0.0

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

## Development

- [Contributing Guide](CONTRIBUTING.md)
- [Release Management](docs/release.md) - Automated versioning and releases

## License

MIT
