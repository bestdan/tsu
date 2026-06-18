# Fast early-exit for ownership-irrelevant changes

## Problem

`tsu hook collate` (the pre-push hook) is slow even when a push contains only
ownership-irrelevant files such as yaml or config edits.

The early-exit at `src/commands/hook/collate.ts:157` does not fire in this case:

```typescript
if (dartFiles.length === 0 && graphqlFiles.length === 0 && !runCodeowners) {
  process.exit(0);
}
```

`runCodeowners` is true by default (all hooks run unless a specific flag is
passed), so `!runCodeowners` is false and the hook proceeds to the full Listr
run. The dart/format/dcm/graphql tasks are skipped cheaply, but the codeowners
task always runs (`collate.ts:323`, `skipCondition: false`). It spawns
`tsu git codeowners check`, which shells out to:

- `coach codeowners generate` — regenerates ownership across the whole repo
- `coach codeowners unowned --check` — scans the entire tree

Both are repo-wide and independent of which files changed. That repeated,
unconditional `coach` work is the multi-second cost users feel on yaml-only
pushes.

## Insight

Ownership in `coach` is path-based: `OWNERSHIP` files in directories map paths
to owners. Therefore:

- **Editing an existing file's content** (yaml, config, even dart content) can
  never change ownership or create unowned files. Codeowners can be skipped.
- **Adding / renaming files** can create newly-unowned files or change
  coverage. Codeowners must run.
- **Modifying an `OWNERSHIP` / `CODEOWNERS` file** changes the ownership
  mapping. Codeowners must run.

So codeowners only needs to run when the pushed change *can* affect ownership.
Detecting that requires the git change *type* (A/M/R/D), which the current
detection path discards (`get-files-in-range.ts:32` uses
`git diff --name-only --diff-filter=ACMR`).

## Design

### 1. Capture change type during detection

Add a status-aware sibling to `getFilesInRange`
(`src/commands/git/utils/range/get-files-in-range.ts`) that runs
`git diff --name-status <range>` once and returns
`Array<{ path: string; status: string }>` where `status` is git's
`A` / `M` / `D` / `R###` / `C###` code.

The existing `--name-only` functions remain unchanged so other commands and the
public API (`src/index.ts`) are unaffected.

### 2. Relevance rule

Codeowners is relevant if any pushed file is:

- **Added or renamed** (`status` starts with `A` or `R`), **or**
- a **modified `OWNERSHIP` / `CODEOWNERS` file** (matched by basename — cheap,
  in-memory).

Pure modifications (`M`) and deletions of ordinary files are not relevant.

The OWNERSHIP-file safety net closes the hole the "out of sync" check exists to
catch: editing an `OWNERSHIP` file makes the generated `CODEOWNERS` stale, and
without this rule a modify-only edit would skip the very check meant to detect
it.

### 3. Wire into `collate.ts`

- Replace the single `getAllChangedFiles` call (`collate.ts:131`) with the
  status-aware fetch; derive both the path list (`allFiles`, for the existing
  dart/graphql filtering) and a `codeownersRelevant` boolean from it. No extra
  git invocations beyond what runs today.
- Change the early-exit condition (`collate.ts:157`) to:

  ```typescript
  if (dartFiles.length === 0 && graphqlFiles.length === 0 &&
      !(runCodeowners && codeownersRelevant)) {
    process.exit(0);
  }
  ```

  Yaml-only diffs now exit immediately.
- Change the codeowners task `skipCondition` (`collate.ts:323`) from `false` to
  `!codeownersRelevant`, so codeowners is skipped even when other relevant files
  (e.g. a modified dart file) keep the hook alive.

### 4. Tests

- Status parsing: `A`, `M`, `R100`, `C`, `D` lines from `git diff
  --name-status` map to the right shape.
- Relevance rule: added file → relevant; renamed file → relevant; modified
  `OWNERSHIP` file → relevant; modified yaml → not relevant.
- `collate`:
  - yaml-only modify → early exit, no codeowners subprocess spawned
  - added file → codeowners runs
  - modified `OWNERSHIP` file → codeowners runs
  - modified dart only → dart tasks run, codeowners skipped

## Out of scope

Collapsing the ~3 redundant `isGitRepo` / `getCurrentBranch` calls in the
detection path (`getFilesToPush` re-calls `isGitRepo`; `getCurrentBranch` calls
it again; `collate` calls it at the top). Each is a sub-100ms `git rev-parse`,
negligible next to the multi-second `coach` cost, and touches shared utils.
Candidate for a separate follow-up.
