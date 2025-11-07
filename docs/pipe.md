# Pipe Commands

Helper utilities for running and tracking command execution in shell scripts using Unix pipes.

## Overview

The pipe commands are designed to work together in a Unix pipeline, allowing you to:
- Run commands and propagate their exit codes through the pipe
- Display success/failure messages for checks
- Accumulate failures across multiple checks

## pipe run

Run a command and output its exit code to stdout (for piping to the next command).

**Usage:**

```bash
tsu pipe run <command> [options]
```

**Arguments:**

- `command` - The command to execute (must be quoted if it contains spaces or special characters)

**Options:**

- `-v, --verbose` - Show the command being run (output to stderr)

**Behavior:**

1. Executes the given command with stdio inherited (output is visible)
2. Captures the exit code
3. Outputs the exit code to stdout (for piping)
4. Exits with that exit code

**Examples:**

Run a command and pipe to echoOutcome:
```bash
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format'
```

## pipe echoOutcome

Read exit code from stdin, display outcome message, and propagate the exit code.

**Usage:**

```bash
tsu pipe echoOutcome <label> [options]
```

**Arguments:**

- `label` - A descriptive label for the check (e.g., "format", "analysis", "tests")

**Options:**

- `-v, --verbose` - Show the exit code (output to stderr)

**Behavior:**

1. Reads exit code from stdin (output from previous pipe command)
2. Displays ✅ {label} passed or ❌ {label} failed to stderr
3. Outputs the exit code to stdout (for next pipe command)
4. Exits with that exit code

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

Display outcome for a check:
```bash
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format'
# stderr: ✅ format passed
# stdout: 0
# exit code: 0
```

Chain with other pipe commands:
```bash
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format' | tsu pipe updateExitCode
```

## pipe updateExitCode

Read exit code from stdin, accumulate failures in a temp file, and output the accumulated exit code.

**Usage:**

```bash
tsu pipe updateExitCode [options]
```

**Options:**

- `-v, --verbose` - Show the accumulated exit code (output to stderr)
- `--reset` - Reset the accumulated exit code to 0

**Behavior:**

1. Reads exit code from stdin (output from previous pipe command)
2. Reads the accumulated exit code from a temp file
3. If either the current or accumulated code is non-zero, sets accumulated to 1
4. Writes the accumulated exit code back to the temp file
5. Outputs the accumulated exit code to stdout
6. Exits with the accumulated exit code

**Examples:**

Track failures across multiple checks:
```bash
# Reset the accumulator
tsu pipe updateExitCode --reset

# Run checks - failures are accumulated
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format' | tsu pipe updateExitCode || true
tsu pipe run 'tsu hook analysis check' | tsu pipe echoOutcome 'analysis' | tsu pipe updateExitCode || true
tsu pipe run 'tsu hook dcm check' | tsu pipe echoOutcome 'dcm' | tsu pipe updateExitCode || true

# Check final result (exit code will be 1 if any check failed)
tsu pipe updateExitCode < /dev/null
```

## Pipe Chain Examples

### Basic check with outcome display

```bash
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format'
```

Output:
```
✅ format passed
```

### Multiple checks with failure tracking

```bash
#!/bin/bash
set +e  # Don't exit on error

# Reset accumulator
tsu pipe updateExitCode --reset > /dev/null 2>&1

# Run all checks
tsu pipe run 'tsu hook format check' | tsu pipe echoOutcome 'format' | tsu pipe updateExitCode > /dev/null 2>&1 || true
tsu pipe run 'tsu hook analysis check' | tsu pipe echoOutcome 'analysis' | tsu pipe updateExitCode > /dev/null 2>&1 || true
tsu pipe run 'tsu hook dcm check' | tsu pipe echoOutcome 'dcm' | tsu pipe updateExitCode > /dev/null 2>&1 || true

# Get final exit code
exit_code=$(tsu pipe updateExitCode < /dev/null 2>&1)
echo "All checks completed with exit code: $exit_code"

# Exit with the accumulated code
exit $exit_code
```

### Simplified version with helper script

Create a helper script to make it easier:

```bash
#!/bin/bash
# check_all.sh

run_check() {
    local cmd="$1"
    local label="$2"
    tsu pipe run "$cmd" | tsu pipe echoOutcome "$label" | tsu pipe updateExitCode > /dev/null 2>&1 || true
}

# Reset
tsu pipe updateExitCode --reset > /dev/null 2>&1

# Run checks
run_check 'tsu hook format check' 'format'
run_check 'tsu hook analysis check' 'analysis'
run_check 'tsu hook dcm check' 'dcm'

# Get result
tsu pipe updateExitCode < /dev/null
```

## Legacy Commands (Still Available)

### pipe check

Wrapper command that runs a command directly (not using pipes).

**Usage:**

```bash
tsu pipe check <command> <label> [options]
```

This is equivalent to, but more convenient than:
```bash
tsu pipe run '<command>' | tsu pipe echoOutcome '<label>'
```

### pipe series

Run multiple checks in series without using pipes.

**Usage:**

```bash
tsu pipe series <command1> <label1> <command2> <label2> ... [options]
```

This is more convenient than chaining multiple pipe commands when you don't need to accumulate exit codes.

## Comparison

**Pipe chain approach** (using `run`, `echoOutcome`, `updateExitCode`):
- More flexible and composable
- Can be used in complex shell scripts
- Follows Unix philosophy of small tools
- Requires understanding of pipes

**Direct approach** (using `check` and `series`):
- Simpler to use
- All-in-one commands
- Better for simple scripts
- Less flexible

Choose the approach that best fits your use case!
