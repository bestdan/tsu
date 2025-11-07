# Pipe Commands

Helper utilities for running and tracking command execution in shell scripts.

## pipe check

Run a command and display a success/failure message with a custom label. The command exits with the same exit code as the wrapped command, making it suitable for use in pipelines and scripts.

**Usage:**

```bash
tsu pipe check <command> <label> [options]
```

**Arguments:**

- `command` - The command to execute (must be quoted if it contains spaces or special characters)
- `label` - A descriptive label for the check (e.g., "format", "analysis", "tests")

**Options:**

- `-v, --verbose` - Show detailed information including the command being run and exit codes (output to stderr)

**Exit codes:**

- Returns the same exit code as the wrapped command
- `0` if the command succeeds
- Non-zero if the command fails

**Output format:**

Success:
```
✅ <label> passed
```

Failure:
```
❌ <label> failed
```

**Examples:**

Check if format passes:
```bash
tsu pipe check 'tsu hook format check' 'format'
# Output: ✅ format passed
```

Check if analysis passes:
```bash
tsu pipe check 'tsu hook analysis check' 'analysis'
# Output: ❌ analysis failed (if it fails)
```

Use with conditional execution:
```bash
tsu pipe check 'tsu hook format check' 'format' && echo "All good!" || echo "Fix formatting"
```

Verbose mode shows the command and exit code:
```bash
tsu pipe check 'exit 42' 'test' --verbose
# stderr: Running: exit 42
# stderr: Exit code: 42
# stdout: ❌ test failed
# exits with code 42
```

## pipe series

Run multiple checks in series and return failure if any check fails. All checks are executed even if some fail, allowing you to see all results before the command exits.

**Usage:**

```bash
tsu pipe series <command1> <label1> <command2> <label2> ... [options]
```

**Arguments:**

- Alternating pairs of `<command>` and `<label>` arguments
- At least one pair is required
- Commands must be quoted if they contain spaces or special characters

**Options:**

- `-v, --verbose` - Show detailed information including commands being run and summary (output to stderr)

**Exit codes:**

- `0` - All checks passed
- `1` - One or more checks failed

**Output format:**

For each check:
```
✅ <label> passed
```
or
```
❌ <label> failed
```

**Examples:**

Run multiple checks in sequence:
```bash
tsu pipe series \
  'tsu hook format check' 'format' \
  'tsu hook analysis check' 'analysis' \
  'tsu hook dcm check' 'dcm'
```

Output (if analysis fails):
```
✅ format passed
❌ analysis failed
✅ dcm passed
```
Exit code: 1 (because at least one check failed)

Use in CI/CD pipelines:
```bash
tsu pipe series \
  'npm run lint' 'linting' \
  'npm test' 'tests' \
  'npm run build' 'build' \
|| exit 1
```

Verbose mode shows progress:
```bash
tsu pipe series \
  'exit 0' 'check1' \
  'exit 0' 'check2' \
  --verbose
```

stderr output:
```
Running: exit 0
Running: exit 0

✅ All checks passed
```

## Use Cases

### Pre-push Hook

Run multiple checks before pushing:

```bash
#!/bin/bash
# .git/hooks/pre-push

tsu pipe series \
  'tsu hook format check' 'format' \
  'tsu hook analysis check' 'analysis' \
  'tsu hook dcm check' 'dcm' \
  --verbose
```

### CI/CD Pipeline

Check multiple aspects of your codebase:

```bash
tsu pipe series \
  'tsu check externals' 'dependencies' \
  'npm run lint' 'linting' \
  'npm test' 'tests' \
  'npm run build' 'build'
```

### Custom Build Script

Wrap individual build steps:

```bash
#!/bin/bash

tsu pipe check 'npm run clean' 'clean' || exit 1
tsu pipe check 'npm run build:types' 'types' || exit 1
tsu pipe check 'npm run build:js' 'javascript' || exit 1
tsu pipe check 'npm run test' 'tests' || exit 1
```

### Tracking Multiple Check Results

Use `pipe series` to run all checks and get a single exit code:

```bash
# This runs all checks and exits 1 if any fail
tsu pipe series \
  'tsu hook format check' 'format' \
  'tsu hook analysis check' 'analysis' \
  'tsu hook dcm check' 'dcm'

# Capture exit code
exit_code=$?

if [ $exit_code -eq 0 ]; then
  echo "✅ All checks passed!"
else
  echo "❌ Some checks failed"
  exit 1
fi
```
