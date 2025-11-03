# tsutils

TypeScript command line utilities package.

## Setup

This project uses:

- **pnpm** for package management
- **TypeScript** with ESM modules
- **Commander.js** for CLI functionality
- **Vitest** for testing
- **ESLint** for linting
- **Prettier** for code formatting

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

## Usage

After building, link the package globally (`pnpm link --global`):

```bash
tsutils <namespace> <command> [options]
```

### Available Namespaces

- **git** - Git-related utilities ([documentation](docs/git.md))
- **dart** - Dart/Flutter project utilities ([documentation](docs/dart.md))
- **files** - File filtering utilities ([documentation](docs/files.md))

### Quick Examples

```bash
# Check if in a git repository
tsutils git check && echo "In a git repo"

# Get git root path
cd "$(tsutils git root)"

# Show changed files
tsutils git changed

# Format check for Dart files (git hook)
tsutils dart hook format check

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

### Optional Dependencies

Some commands require additional tools:
- **Claude CLI**: For `git commit-msg` and `git pr-description` - [Install](https://github.com/anthropics/claude-cli)
- **Dart SDK**: For `dart` commands - [Install](https://dart.dev)
- **DCM**: For `dart hook dcm check` - [Install](https://dcm.dev)
- **Melos**: For `dart hook graphql check` - [Install](https://melos.invertase.dev)

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

For detailed command documentation, see:
- [Git Commands](docs/git.md)
- [Dart Commands](docs/dart.md)
- [Files Commands](docs/files.md)

## Development

For Copilot agent development and MCP server information:
- [MCP Servers](docs/mcp-servers.md) - Model Context Protocol servers for AI development

[Contributing](CONTRIBUTING.md)

## License

MIT
