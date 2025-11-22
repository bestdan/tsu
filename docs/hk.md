# HK Integration

TSU provides seamless integration with [HK](https://github.com/jdx/hk), a high-performance git hook manager that runs hooks in parallel for faster execution.

## Why Use HK with TSU?

- **Parallel Execution**: HK runs multiple TSU hooks simultaneously, significantly reducing pre-commit and pre-push times
- **Smart File Locking**: HK prevents race conditions when multiple hooks modify the same files
- **Better Performance**: Optimized for speed with check-first strategies and batch processing
- **Flexible Configuration**: Use Pkl (Pickle) configuration for powerful, type-safe hook definitions

## Quick Setup

### Prerequisites

1. Install TSU globally:
```bash
# Using pnpm:
pnpm add -g github:bestdan/tsu

# Using npm:
npm install -g github:bestdan/tsu

# Or build from source:
git clone https://github.com/bestdan/tsu.git
cd tsu && pnpm install && pnpm build && pnpm link --global
```

2. Install HK (requires Rust/Cargo):
```bash
# Install Rust if you haven't already
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install HK
cargo install hk
```

### Run the Setup Script

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/bestdan/tsu/main/scripts/setup-hk.sh | bash
```

### Manual Setup

If you prefer manual setup:

```bash
# 1. Copy the template to your project
curl -o hk.pkl https://raw.githubusercontent.com/bestdan/tsu/main/templates/hk.pkl

# 2. Initialize HK in your repository
hk init
```

## Template Configuration

The provided `hk.pkl` template includes all TSU hooks configured for parallel execution:

### Pre-commit Hooks (Fast, with Auto-fix)

- `dart-format`: Auto-format Dart code
- `dart-fix`: Apply Dart lint fixes
- `dcm-fix`: Apply DCM fixes (if DCM is installed)

### Pre-push Hooks (Comprehensive Checks)

- `dart-format`: Verify code formatting
- `dart-analysis`: Run static analysis
- `dart-fix`: Check for lint fixes
- `dcm-analyze`: Run DCM analysis (if DCM is installed)
- `dcm-fix`: Check for DCM fixes (if DCM is installed)
- `graphql`: Verify GraphQL codegen is up to date (if using GraphQL)

### Manual Commands

```bash
# Run all checks (no auto-fix)
hk check

# Run all checks with auto-fix
hk fix

# Run specific hook
hk run pre-push
```

## Customizing Your Configuration

Edit `hk.pkl` to customize which hooks run and when:

```pkl
// Example: Add custom pre-commit step
["pre-commit"] {
    fix = true
    steps {
        ["my-custom-check"] {
            glob = List("*.dart")
            check = "echo 'Running custom check'"
        }
        // ... existing TSU hooks
    }
}
```

## Performance Benefits

HK's parallel execution can significantly reduce hook execution time:

| Hook Setup                  | Execution Time\* |
| --------------------------- | ---------------- |
| Sequential (Lefthook/Husky) | ~15-20 seconds   |
| Parallel (HK)               | ~5-8 seconds     |

\* Times vary based on project size and number of changed files

## Comparison with Other Hook Managers

### HK vs Lefthook

- **HK**: Better parallel performance, Pkl configuration, integrated linter features
- **Lefthook**: YAML configuration, simpler setup, widely adopted

### HK vs Husky

- **HK**: Much faster with parallel execution, better for monorepos
- **Husky**: Simpler, just runs shell scripts, good for small projects

## File Filtering

HK automatically filters files based on glob patterns, running hooks only on relevant files. The template configures:

- `*.dart` files for Dart-related hooks
- `*.graphql` files for GraphQL hooks

## Troubleshooting

### HK Not Running Hooks

Ensure HK is initialized:

```bash
hk init
```

### TSU Commands Not Found

Install TSU globally:

```bash
pnpm add -g github:bestdan/tsu
```

### Optional Dependencies Warning

Some hooks (DCM, GraphQL) require additional tools. The template suppresses these warnings with:

```pkl
hide_warnings = List("missing-profiles")
```

## Advanced Features

### Check-First Strategy

HK runs lightweight checks before expensive fixes:

```pkl
check_first = true // Run check before fix (default)
```

### Batch Processing

Process files in batches for better parallelization:

```pkl
batch = true // Split files into batches
```

### Workspace Detection

For monorepos, specify workspace indicators:

```pkl
workspace_indicator = "pubspec.yaml"
```

## Additional Resources

- [HK Documentation](https://hk.jdx.dev/)
- [Pkl Configuration Language](https://pkl-lang.org/)
- [TSU Hook Documentation](hook.md)

## Migrating from Lefthook

If you're currently using Lefthook, you can run both side-by-side during migration:

1. Keep your existing `lefthook.yml`
2. Set up `hk.pkl` alongside it
3. Test HK hooks: `hk check`
4. Once satisfied, remove Lefthook: `lefthook uninstall`

The HK template provides equivalent functionality to typical Lefthook TSU configurations.
