#!/usr/bin/env bash

set -eEuo pipefail

nodenv install --skip-existing 20.19.5
nodenv local 20.19.5

pnpm install
pnpm build

pnpm link --global