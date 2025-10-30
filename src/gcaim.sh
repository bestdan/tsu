# Source shared Claude utilities
source "${DOTFILES:-$HOME/src/dotfiles}/zsh/profiles/default/claude_utils.zsh"

# Create a git commit message using claude
gcaim() {
  local staged_diff
  staged_diff=$(git diff --cached 2>/dev/null)
  if [[ -n "$staged_diff" ]]; then
    local prompt
    read -r -d '' prompt <<'EOF'
Generate a commit message from the git diff provided via stdin.

Output format: Plain text only. No markdown. No code blocks. No explanations.

Start immediately with the commit message in Conventional Commits format:
<type>(<scope>): <description>

<optional body>

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

Do not ask questions. Do not add commentary. Output only the commit message.
EOF

    local output
    output=$(__call_claude_with_diff "$prompt" "$staged_diff")
    local exit_code=$?

    if [[ $exit_code -ne 0 ]]; then
      return 1
    fi

    local filtered_output=$(command grep -vE '^(diff --git|new file mode|deleted file mode|index )' <<< "$output" || true)

    echo "${filtered_output:-$output}"
    return 0
  else
    echo "No changes staged for commit. Use 'git add' first." >&2
    return 1
  fi
}
