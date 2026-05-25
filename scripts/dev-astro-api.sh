#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/setup-backend-venv.sh"

# shellcheck disable=SC1091
source "$ROOT/services/.venv/bin/activate"

export SERVICE_NAME=astro-api
export ASTRO_API_PORT="${ASTRO_API_PORT:-8100}"

cd "$ROOT"
exec uvicorn astro_api.main:app --reload --host 0.0.0.0 --port "$ASTRO_API_PORT"
