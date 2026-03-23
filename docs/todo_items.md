# TODO Items

## Consolidate type-narrowing in codeowners check error handling

**File:** `src/commands/git/codeowners/check.ts` (lines 129-141)

The `error && typeof error === 'object' && 'stdout' in error` pattern appears twice with near-identical structure for stdout and stderr. Consolidate into a single narrowing block:

```typescript
if (error && typeof error === 'object') {
  const execError = error as { stdout?: Buffer | string; stderr?: Buffer | string };
  const stdout = execError.stdout?.toString().trim();
  const stderr = execError.stderr?.toString().trim();
  if (stdout) {
    console.error('');
    console.error('Unowned files:');
    console.error(stdout);
  }
  if (stderr) {
    console.error(stderr);
  }
}
```
