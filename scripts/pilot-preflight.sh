#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

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

echo "=== Pilot preflight (Package 13) ==="

check "pnpm-lock.yaml present" test -f pnpm-lock.yaml
check "package.json present" test -f package.json

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

APP_ENV="${APP_ENV:-development}"
echo "APP_ENV=${APP_ENV}"

check "APP_ENV set" test -n "${APP_ENV}"

if [[ "$APP_ENV" == "production" ]]; then
  check "production forbids PAYMENT_API_MODE=mock" test "${PAYMENT_API_MODE:-mock}" != "mock"
  check "production forbids ASTRO_API_MODE=mock" test "${ASTRO_API_MODE:-mock}" != "mock"
  if [[ "${PAYMENT_API_MODE:-mock}" == "remote" ]]; then
    check "PAYMENT_API_BASE_URL set" test -n "${PAYMENT_API_BASE_URL:-}"
    check "PAYMENT_API_TOKEN set" test -n "${PAYMENT_API_TOKEN:-}"
  fi
  if [[ "${ASTRO_API_MODE:-mock}" == "remote" ]]; then
    check "ASTRO_API_BASE_URL set" test -n "${ASTRO_API_BASE_URL:-}"
    check "ASTRO_API_TOKEN set" test -n "${ASTRO_API_TOKEN:-}"
  fi
elif [[ "$APP_ENV" == "staging" ]]; then
  if [[ "${PAYMENT_API_MODE:-mock}" == "mock" || "${ASTRO_API_MODE:-mock}" == "mock" ]]; then
    check "staging mock requires ALLOW_STAGING_MOCKS=true" test "${ALLOW_STAGING_MOCKS:-false}" = "true"
  fi
fi

FORBIDDEN_PATTERN='Shadow Self Report|Ritual Consultation|VIP Natal Consultation|Descend Into Your Shadow'
LEGACY_HITS=$(
  grep -R -E "$FORBIDDEN_PATTERN" \
    apps/dashboard apps/miniapp apps/superadmin \
    packages/tenant-config/src packages/mock-api/src/fixtures \
    services/saas-api/src \
    --include='*.ts' --include='*.tsx' --include='*.py' \
    2>/dev/null | grep -v -E '\.test\.|/tests/|ops-seed\.test|legacy|deprecated' || true
)
if [[ -n "$LEGACY_HITS" ]]; then
  echo "FAIL: forbidden legacy product copy in active paths"
  echo "$LEGACY_HITS" | head -5
  FAIL=$((FAIL + 1))
else
  echo "PASS: no forbidden legacy product names in active paths"
  PASS=$((PASS + 1))
fi

if grep -q 'free_report' packages/tenant-config/src/product-catalog.ts && \
   grep -q 'main_natal_portrait' packages/tenant-config/src/product-catalog.ts; then
  echo "PASS: approved product catalog present"
  PASS=$((PASS + 1))
else
  echo "FAIL: approved product catalog missing"
  FAIL=$((FAIL + 1))
fi

if find . -path ./node_modules -prune -o -name '.env' -print 2>/dev/null | grep -q .; then
  echo "WARN: .env files present (exclude from archive)"
else
  echo "PASS: no .env files in tree root scan"
  PASS=$((PASS + 1))
fi

if [[ "$QUICK" == "false" ]]; then
  if pnpm typecheck; then
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
