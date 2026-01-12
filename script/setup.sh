#!/usr/bin/env bash

set -eEuo pipefail

# Ensure mise is available
if ! command -v mise &> /dev/null; then
    echo "Error: mise is not installed. Install it from https://mise.jdx.dev"
    exit 1
fi

# Install node 22.14.0 if not already installed (reads from .nvmrc)
mise install node@22.14.0

# Verify we're using the correct node version
echo "Using node $(node --version)"
echo "Using pnpm $(pnpm --version)"

# Install dependencies and build
pnpm install
pnpm build

# Link globally for development
pnpm link --global

echo "✓ Setup complete! Refresh your terminal and 'tsu' command should be available."
