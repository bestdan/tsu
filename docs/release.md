# Release Management

This document describes the automated build and release tracking system for tsutils.

## Overview

The project uses an automated versioning and release system with two main workflows:

1. **Auto Version Bump** - Automatically increments the minor version when a PR is merged to main
2. **Manual Release** - Allows creating a GitHub release at a specific version

## Auto Version Bump

### How It Works

When a pull request is merged to the `main` branch:

1. The workflow automatically increments the **minor** version
2. The patch version is reset to 0
3. A new pull request is created with the version bump in `package.json`
4. Once the version bump PR is merged, a git tag is created automatically (e.g., `v0.2.0`)

This two-step process ensures that all branch protection rules and required status checks are respected.

### Example

- Current version: `0.1.0`
- PR #123 is merged to main
- Auto version bump workflow creates PR #124 to bump version to `0.2.0`
- PR #124 is reviewed and merged
- Tag `v0.2.0` is automatically created

### Skipping Version Bump

If you need to merge a PR without bumping the version (e.g., for documentation-only changes), you cannot currently skip the auto-bump. Consider this when planning releases.

## Manual Release Workflow

### How to Create a Release

1. Go to the **Actions** tab in GitHub
2. Select the **Create Release** workflow
3. Click **Run workflow**
4. Enter the version number (format: `X.Y.Z`, e.g., `1.2.0`)
5. Optionally mark as pre-release
6. Click **Run workflow**

### What It Does

1. Validates the version format
2. Checks that the version doesn't already exist
3. Runs build and tests
4. Updates `package.json` with the specified version
5. Creates and pushes a git tag
6. Generates a changelog from commits
7. Creates a GitHub release with the changelog

### Version Requirements

- Must be in format `X.Y.Z` (e.g., `1.2.0`, `2.0.0`)
- Must not already exist as a git tag
- Should follow semantic versioning principles

## Versioning Strategy

This project follows [Semantic Versioning](https://semver.org/):

- **Major version** (`X.0.0`) - Breaking changes
- **Minor version** (`0.X.0`) - New features, backwards compatible
- **Patch version** (`0.0.X`) - Bug fixes, backwards compatible

### Current Behavior

- **Merged PRs**: Automatically bump minor version
- **Manual releases**: You specify the exact version

### Recommendations

- Use auto-bumped versions for regular development
- Use manual releases for:
  - Major version releases with breaking changes
  - Patch releases for hotfixes
  - Pre-releases for testing

## Examples

### Scenario 1: Regular Development

1. Current version: `0.1.0`
2. Merge PR #1 → Auto-bumps to `0.2.0`
3. Merge PR #2 → Auto-bumps to `0.3.0`
4. Ready for major release → Manually release `1.0.0`

### Scenario 2: Hotfix

1. Current version: `1.2.0`
2. Critical bug found
3. Create hotfix PR and merge → Auto-bumps to `1.3.0`
4. If you need `1.2.1` instead, manually release `1.2.1` after merging

### Scenario 3: Pre-release

1. Current version: `1.0.0`
2. Working on major new features
3. Manually release `2.0.0-beta.1` (with pre-release flag)
4. Test and iterate
5. Manually release `2.0.0` when ready

## Troubleshooting

### Version Already Exists

If you try to manually release a version that already exists, the workflow will fail. Check existing tags with:

```bash
git tag -l
```

### Failed Build or Tests

The manual release workflow will fail if the build or tests fail. Fix the issues and try again.

### Conflicts After Auto-Bump

If the auto-bump creates a conflict (rare), you may need to manually resolve it:

1. Pull the latest changes
2. Resolve conflicts
3. Push the resolution

## Future Enhancements

Potential improvements to consider:

- Configuration to skip auto-bump for certain PR labels (e.g., `skip-version-bump`)
- Support for patch version bumps based on PR type
- Automated changelog generation with conventional commits
- NPM package publishing integration
