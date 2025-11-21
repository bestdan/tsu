#!/usr/bin/env bash
# Setup script for HK and TSU integration
# This script installs HK (git hook manager) and sets up TSU hooks

set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Not in a git repository. Please run this script from within a git repository."
    exit 1
fi

# Check if tsu is installed
if ! command -v tsu &> /dev/null; then
    warn "TSU is not installed globally."
    info "Please install TSU first using one of these methods:"
    echo ""
    echo "  # Using pnpm:"
    echo "  pnpm add -g github:bestdan/tsu"
    echo ""
    echo "  # Using npm:"
    echo "  npm install -g github:bestdan/tsu"
    echo ""
    echo "  # Using yarn:"
    echo "  yarn global add github:bestdan/tsu"
    echo ""
    echo "  # Or build from source:"
    echo "  git clone https://github.com/bestdan/tsu.git"
    echo "  cd tsu && pnpm install && pnpm build && pnpm link --global"
    echo ""
    error "Please install TSU and run this script again."
    exit 1
else
    info "TSU is already installed: $(which tsu)"
fi

# Check if hk is installed
if ! command -v hk &> /dev/null; then
    warn "HK is not installed."
    info "Installing HK..."
    
    # Install HK using the recommended method
    if command -v cargo &> /dev/null; then
        cargo install hk
    else
        error "Cargo (Rust) is required to install HK."
        info "Please install Rust from https://rustup.rs/ and try again."
        info "Alternatively, visit https://github.com/jdx/hk for other installation methods."
        exit 1
    fi
    
    info "HK installed successfully!"
else
    info "HK is already installed: $(which hk)"
fi

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
REPO_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Copy the HK template if hk.pkl doesn't exist
if [ -f "hk.pkl" ]; then
    warn "hk.pkl already exists in the current directory."
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        info "Skipping hk.pkl creation."
    else
        cp "$REPO_ROOT/templates/hk.pkl" hk.pkl
        info "Created hk.pkl from template"
    fi
else
    cp "$REPO_ROOT/templates/hk.pkl" hk.pkl
    info "Created hk.pkl from template"
fi

# Initialize HK hooks
info "Initializing HK git hooks..."
hk init

info ""
info "✅ Setup complete!"
info ""
info "HK and TSU are now configured for this repository."
info "You can customize the hk.pkl file to adjust which hooks run."
info ""
info "Useful commands:"
info "  hk check          - Run all checks manually"
info "  hk fix            - Run all fixes manually"
info "  hk run pre-push   - Run pre-push hooks manually"
info ""
