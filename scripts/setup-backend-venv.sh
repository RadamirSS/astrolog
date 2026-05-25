#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
VENV="$ROOT/services/.venv"

if [[ ! -d "$VENV" ]]; then
  echo "Creating Python venv at services/.venv ..."
  python3 -m venv "$VENV"
fi

# shellcheck disable=SC1091
source "$VENV/bin/activate"

pip install --upgrade pip setuptools wheel >/dev/null

echo "Installing backend-common (editable) ..."
pip install -e "$ROOT/services/backend-common[dev]" >/dev/null

echo "Installing saas-api (editable) ..."
pip install -e "$ROOT/services/saas-api[dev]" >/dev/null

echo "Installing astro-api (editable) ..."
pip install -e "$ROOT/services/astro-api[dev]" >/dev/null

echo "Backend venv ready: $VENV"
