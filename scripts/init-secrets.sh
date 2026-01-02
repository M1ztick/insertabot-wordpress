#!/usr/bin/env bash
set -euo pipefail

# Initialize Node-based secret scanning (secretlint + husky)
# Usage: ./scripts/init-secrets.sh

echo "Installing Node dependencies and Husky hooks..."
if command -v npm >/dev/null 2>&1; then
  npm ci
  npm run prepare
  echo "Installed dependencies and Husky hooks. You can run 'npm run scan:secrets' to scan the repo."
else
  echo "npm is not available on PATH. Please install Node.js and npm first." >&2
  exit 1
fi
