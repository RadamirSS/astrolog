#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/setup-backend-venv.sh"

# shellcheck disable=SC1091
source "$ROOT/services/.venv/bin/activate"

export SERVICE_NAME=saas-api
export SAAS_API_PORT="${SAAS_API_PORT:-8000}"

cd "$ROOT"
exec uvicorn saas_api.main:app --reload --host 0.0.0.0 --port "$SAAS_API_PORT"
