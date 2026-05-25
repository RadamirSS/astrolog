#!/usr/bin/env bash
# Bootstrap a closed-pilot environment: migrations + seed + URL summary.
#
# Usage:
#   cp .env.example .env.local
#   pnpm pilot:bootstrap
#
# Optional:
#   ENV_FILE=/path/to/.env.staging pnpm pilot:bootstrap

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT/.env.local}"

if [[ -f "$ENV_FILE" ]]; then
  echo "Loading environment from $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "No env file at $ENV_FILE — using process environment defaults."
fi

echo "Running database migrations..."
bash "$ROOT/scripts/db-migrate-saas.sh"

echo "Seeding pilot data..."
bash "$ROOT/scripts/db-seed-saas.sh"

echo ""
echo "Pilot bootstrap complete."
if [[ "${APP_ENV:-development}" == "development" ]]; then
  echo "Dev bootstrap accounts (change before shared deploy):"
  echo "  Platform owner: ${SAAS_BOOTSTRAP_ADMIN_EMAIL:-admin@astro.local}"
  echo "  Blogger owner:  ${SAAS_BOOTSTRAP_BLOGGER_EMAIL:-blogger@astro.local}"
fi
