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
