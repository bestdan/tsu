# Generate a GitHub PR description using claude based on changes between main and current branch
prdai() {
  __check_git_repository || return 1

  local current_branch
  current_branch=$(__get_current_branch) || return 1

  __check_not_main_branch "$current_branch" || return 1

  # Get the diff between main and current branch
  local branch_diff
  branch_diff=$(git diff main...HEAD 2>/dev/null)

  if [[ -z "$branch_diff" ]]; then
    echo "Error: No changes found between main and current branch ($current_branch)" >&2
    return 1
  fi

  local prompt
  read -r -d '' prompt <<'EOF'
Generate a GitHub pull request description from the git diff provided via stdin.

Output format: Plain text with markdown formatting. Use standard GitHub PR description structure.

Structure:
## Summary
Brief overview of what this PR accomplishes (2-3 sentences max)

## Changes
- Bullet point list of key changes
- Focus on what changed and why
- Group related changes together

## Testing
Brief notes on how to test these changes or what was tested

Start immediately with the PR description. Do not ask questions. Do not add meta-commentary about the PR itself.
EOF

  local output
  output=$(__call_claude_with_diff "$prompt" "$branch_diff")
  local exit_code=$?

  if [[ $exit_code -ne 0 ]]; then
    return 1
  fi

  echo "$output"
  return 0
}