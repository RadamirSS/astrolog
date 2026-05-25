#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/setup-backend-venv.sh"

# shellcheck disable=SC1091
source "$ROOT/services/.venv/bin/activate"

export SAAS_API_PORT="${SAAS_API_PORT:-8000}"
export ASTRO_API_PORT="${ASTRO_API_PORT:-8100}"

cd "$ROOT"

SERVICE_NAME=saas-api uvicorn saas_api.main:app --reload --host 0.0.0.0 --port "$SAAS_API_PORT" &
SAAS_PID=$!

SERVICE_NAME=astro-api uvicorn astro_api.main:app --reload --host 0.0.0.0 --port "$ASTRO_API_PORT" &
ASTRO_PID=$!

cleanup() {
  kill "$SAAS_PID" "$ASTRO_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "SaaS API: http://localhost:$SAAS_API_PORT (docs: /docs)"
echo "Astro API: http://localhost:$ASTRO_API_PORT (docs: /docs)"
echo "Press Ctrl+C to stop both services."

wait
