#!/usr/bin/env bash

set -eEuo pipefail

# Function to log messages
log_message() {
  local level=$1
  shift
  local message="$*"
  echo "[$(date -u +"%Y-%m-%dT%H:%M:%SZ")] [$level] $message"
  
  # If build exists, send to DataDog via logger
  if [ -f "dist/utils/logger.js" ]; then
    node script/setup-logger.js "$level" "$message" 2>/dev/null || true
  fi
}

# Trap errors and log them
trap 'log_message error "Setup failed at line $LINENO"' ERR

log_message info "Starting tsutils setup"

log_message info "Installing Node.js version 20.19.5"
nodenv install --skip-existing 20.19.5 || {
  log_message warn "nodenv not found or installation failed, continuing with system Node.js"
}

if command -v nodenv &> /dev/null; then
  nodenv local 20.19.5 || log_message warn "Failed to set local Node.js version"
else
  log_message warn "nodenv not available, using system Node.js version"
fi

log_message info "Installing dependencies with pnpm"
pnpm install || {
  log_message error "Failed to install dependencies"
  exit 1
}

log_message info "Building project"
pnpm build || {
  log_message error "Failed to build project"
  exit 1
}

log_message info "Linking package globally"
pnpm link --global || {
  log_message warn "Failed to link package globally"
}

log_message info "Setup completed successfully"