#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/setup-backend-venv.sh"

# shellcheck disable=SC1091
source "$ROOT/services/.venv/bin/activate"

cd "$ROOT/services/saas-api"
alembic upgrade head
