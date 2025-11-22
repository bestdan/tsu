# Check Commands

Commands for checking system dependencies and environment.

## check externals

Check if external dependencies are installed. This command verifies the presence of optional external tools used by various tsutils commands.

**Usage:**

```bash
tsu check externals [options]
```

**Options:**

- `-v, --verbose` - Show human-readable status messages (output to stderr)

**Exit codes:**

- `0` - All external dependencies are installed
- `1` - One or more external dependencies are not installed

**Output format:**

By default, outputs parseable status lines to stdout:

```
dart: installed
dcm: not_installed
melos: not_installed
claude: installed
```

With `--verbose`, also displays human-readable messages to stderr:

```
🔍 Checking external dependencies...
✓ Dart SDK (dart) - installed
✗ DCM (dcm) - not installed
  Install: https://dcm.dev
✗ Melos (melos) - not installed
  Install: https://melos.invertase.dev
✓ Claude CLI (claude) - installed

⚠️  Some external dependencies are not installed
```

**Checked dependencies:**

| Command  | Name       | Required For                           | Install URL                              |
| -------- | ---------- | -------------------------------------- | ---------------------------------------- |
| `dart`   | Dart SDK   | All `dart` and `hook` commands         | https://dart.dev                         |
| `dcm`    | DCM        | `hook dcm` commands                    | https://dcm.dev                          |
| `melos`  | Melos      | `hook graphql check`                   | https://melos.invertase.dev              |
| `claude` | Claude CLI | `git commit-msg`, `git pr-description` | https://github.com/anthropics/claude-cli |

**Examples:**

Check all external dependencies:

```bash
tsu check externals
```

Check with detailed output:

```bash
tsu check externals --verbose
```

Use in scripts:

```bash
if tsu check externals | grep -q "dart: installed"; then
  echo "Dart is installed"
fi
```

Check and install missing dependencies:

```bash
tsu check externals --verbose || echo "Please install missing dependencies"
```

## check version

Check if tsutils is on the most recent version by comparing against the latest GitHub release.

**Usage:**

```bash
tsu check version [options]
```

**Options:**

- `-v, --verbose` - Show human-readable status messages (output to stderr)

**Exit codes:**

- `0` - You are on the latest version
- `1` - An update is available or an error occurred

**Output format:**

By default, outputs parseable status lines to stdout:

```
current: 0.6.0
latest: 0.7.0
update_available: true
```

With `--verbose`, also displays human-readable messages to stderr:

When up-to-date:

```
🔍 Checking for updates...
✓ You are on the latest version (0.6.0)
```

When update is available:

```
🔍 Checking for updates...
📦 Current version: 0.6.0
✨ Latest version: 0.7.0
⚠️  Update available! Run 'tsu upgrade' to update.
```

**Examples:**

Check version status:

```bash
tsu check version
```

Check with detailed output:

```bash
tsu check version --verbose
```

Use in scripts to detect updates:

```bash
if tsu check version | grep -q "update_available: true"; then
  echo "Update available!"
fi
```

Check version and upgrade if needed:

```bash
tsu check version --verbose || tsu upgrade --verbose
```
