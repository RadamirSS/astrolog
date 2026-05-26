#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# shellcheck source=lib/pnpm-cmd.sh
source "$ROOT/scripts/lib/pnpm-cmd.sh"

PASS=0
FAIL=0
QUICK=false

for arg in "$@"; do
  if [[ "$arg" == "--quick" ]]; then
    QUICK=true
  fi
done

check() {
  local name="$1"
  shift
  if "$@"; then
    echo "PASS: $name"
    PASS=$((PASS + 1))
  else
    echo "FAIL: $name"
    FAIL=$((FAIL + 1))
  fi
}

echo "=== Pilot preflight (Package 14 — Final Gate) ==="

check "pnpm-lock.yaml present" test -f pnpm-lock.yaml
check "package.json present" test -f package.json
check "db migrate script present" test -f scripts/db-migrate-saas.sh
check "migrations directory present" test -d services/saas-api/alembic/versions

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

APP_ENV="${APP_ENV:-development}"
echo "APP_ENV=${APP_ENV}"

check "APP_ENV set" test -n "${APP_ENV}"

PAYMENT_MODE="${PAYMENT_API_MODE:-mock}"
ASTRO_MODE="${ASTRO_API_MODE:-mock}"

if [[ "$PAYMENT_MODE" == "mock" || "$PAYMENT_MODE" == "remote" ]]; then
  echo "PASS: PAYMENT_API_MODE valid (${PAYMENT_MODE})"
  PASS=$((PASS + 1))
else
  echo "FAIL: PAYMENT_API_MODE invalid (${PAYMENT_MODE})"
  FAIL=$((FAIL + 1))
fi

if [[ "$ASTRO_MODE" == "mock" || "$ASTRO_MODE" == "remote" ]]; then
  echo "PASS: ASTRO_API_MODE valid (${ASTRO_MODE})"
  PASS=$((PASS + 1))
else
  echo "FAIL: ASTRO_API_MODE invalid (${ASTRO_MODE})"
  FAIL=$((FAIL + 1))
fi

if [[ "$APP_ENV" == "production" ]]; then
  check "production forbids PAYMENT_API_MODE=mock" test "$PAYMENT_MODE" != "mock"
  check "production forbids ASTRO_API_MODE=mock" test "$ASTRO_MODE" != "mock"
  if [[ "$PAYMENT_MODE" == "remote" ]]; then
    check "PAYMENT_API_BASE_URL set" test -n "${PAYMENT_API_BASE_URL:-}"
    check "PAYMENT_API_TOKEN set" test -n "${PAYMENT_API_TOKEN:-}"
  fi
  if [[ "$ASTRO_MODE" == "remote" ]]; then
    check "ASTRO_API_BASE_URL set" test -n "${ASTRO_API_BASE_URL:-}"
    check "ASTRO_API_TOKEN set" test -n "${ASTRO_API_TOKEN:-}"
  fi
elif [[ "$APP_ENV" == "staging" ]]; then
  if [[ "$PAYMENT_MODE" == "mock" || "$ASTRO_MODE" == "mock" ]]; then
    check "staging mock requires ALLOW_STAGING_MOCKS=true" test "${ALLOW_STAGING_MOCKS:-false}" = "true"
  fi
fi

FORBIDDEN_PATTERN='Shadow Self Report|Ritual Consultation|VIP Natal Consultation|Annual Forecast Dossier|Lunar Ritual Guide|Executive Briefing|Full Natal Chart|personal-path|Book a Ritual Consultation|Shadow Self Deep Dive|Shadow Snapshot|Descend Into Your Shadow Chart|Discover your cosmic path|Life Purpose Signal'
TOPIC_FORBIDDEN='"purpose"|"career"|"family"|"compatibility"|topic.*purpose|topic.*career|topic.*family|topic.*compatibility'

LEGACY_HITS=$(
  grep -R -E "$FORBIDDEN_PATTERN" \
    apps/dashboard apps/miniapp apps/superadmin \
    packages/tenant-config/src packages/mock-api/src/fixtures \
    packages/miniapp-renderer/src packages/i18n/src \
    services/saas-api/src \
    --include='*.ts' --include='*.tsx' --include='*.py' \
    2>/dev/null | grep -v -E '\.test\.|/tests/|ops-seed\.test|legacy|deprecated|LEGACY_|birth_profile' || true
)
if [[ -n "$LEGACY_HITS" ]]; then
  echo "FAIL: forbidden legacy product copy in active paths"
  echo "$LEGACY_HITS" | head -8
  FAIL=$((FAIL + 1))
else
  echo "PASS: no forbidden legacy product names in active paths"
  PASS=$((PASS + 1))
fi

CATALOG_FILE="packages/tenant-config/src/product-catalog.ts"
for marker in free_report low_ticket_money low_ticket_relationships low_ticket_personality bundle_all_topics main_natal_portrait premium_consultation; do
  if grep -q "$marker" "$CATALOG_FILE"; then
    echo "PASS: catalog contains $marker"
    PASS=$((PASS + 1))
  else
    echo "FAIL: catalog missing $marker"
    FAIL=$((FAIL + 1))
  fi
done

if grep -q 'amount:' packages/api-contracts/src/integration/checkout.ts; then
  echo "FAIL: checkout contract exposes amount field"
  FAIL=$((FAIL + 1))
else
  echo "PASS: checkout contract has no amount field"
  PASS=$((PASS + 1))
fi

TOKEN_LEAKS=$(
  grep -R -E 'PAYMENT_API_TOKEN|ASTRO_API_TOKEN' apps packages \
    --include='*.ts' --include='*.tsx' --include='*.json' \
    2>/dev/null | grep -v -E '\.example|ENVIRONMENT|process\.env|NEXT_PUBLIC' || true
)
if [[ -n "$TOKEN_LEAKS" ]]; then
  echo "WARN: possible API tokens in client-exposed files (review manually)"
  echo "$TOKEN_LEAKS" | head -3
else
  echo "PASS: no hardcoded API tokens in client packages"
  PASS=$((PASS + 1))
fi

if find . -path ./node_modules -prune -o -name '.env' -print 2>/dev/null | grep -q .; then
  echo "WARN: .env files present (exclude from archive)"
else
  echo "PASS: no .env files in tree root scan"
  PASS=$((PASS + 1))
fi

if [[ "$QUICK" == "false" ]]; then
  if run_pnpm typecheck; then
    echo "PASS: pnpm typecheck"
    PASS=$((PASS + 1))
  else
    echo "FAIL: pnpm typecheck"
    FAIL=$((FAIL + 1))
  fi
fi

echo "=== Summary: ${PASS} passed, ${FAIL} failed ==="
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
