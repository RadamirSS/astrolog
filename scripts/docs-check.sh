#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0

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

echo "=== Documentation consistency check (PR-ASTRO-DOCS-RU-SYNC-14D) ==="

# Required RU docs
REQUIRED_RU=(
  docs/ru/README.md
  docs/ru/PROJECT_OVERVIEW.md
  docs/ru/ARCHITECTURE.md
  docs/ru/FRONTEND_BACKEND_CONNECTION.md
  docs/ru/API_CONTRACTS.md
  docs/ru/SAAS_API_CONTRACT.md
  docs/ru/ASTRO_API_CONTRACT.md
  docs/ru/PAYMENT_API_CONTRACT.md
  docs/ru/TELEGRAM_BOT_INTEGRATION.md
  docs/ru/CREATOR_DASHBOARD.md
  docs/ru/PUBLIC_SURFACES.md
  docs/ru/COMMERCE_LEDGER.md
  docs/ru/CLOSED_PILOT_RUNBOOK.md
  docs/ru/CLOSED_PILOT_PAYOUT_RUNBOOK.md
  docs/ru/REFUND_ADJUSTMENT_PROCESS.md
  docs/ru/ENVIRONMENT_VARIABLES.md
  docs/ru/INTEGRATIONS.md
  docs/ru/DEPLOYMENT_GUIDE.md
  docs/ru/QA_CHECKLIST.md
  docs/ru/TROUBLESHOOTING.md
)

for f in "${REQUIRED_RU[@]}"; do
  check "required RU doc: $f" test -f "$f"
done

check "docs/README.md exists" test -f docs/README.md
check "docs/legacy/README.md exists" test -f docs/legacy/README.md

# RU index links to mandatory docs
for link in FRONTEND_BACKEND_CONNECTION API_CONTRACTS ENVIRONMENT_VARIABLES; do
  check "docs/ru/README.md links to $link" grep -q "$link" docs/ru/README.md
done

# Root README points to RU docs
check "root README links to docs/ru/" grep -q "docs/ru/README.md" README.md
check "root README not white-label primary title" bash -c '! grep -q "^# Astro Platform — White-Label" README.md'

# Stale phrases in active RU docs (not legacy/)
STALE_PATTERN='Future scope|coming_later|Report V1|White-Label Astrology Mini App'
STALE_HITS=$(grep -R -E "$STALE_PATTERN" docs/ru --include='*.md' 2>/dev/null || true)
if [[ -n "$STALE_HITS" ]]; then
  echo "FAIL: stale phrases in docs/ru/"
  echo "$STALE_HITS" | head -5
  FAIL=$((FAIL + 1))
else
  echo "PASS: no stale phrases in docs/ru/"
  PASS=$((PASS + 1))
fi

# birthCity in RU docs (except deprecated/warning notes)
BIRTHCITY_HITS=$(grep -R 'birthCity' docs/ru --include='*.md' 2>/dev/null \
  | grep -viE 'deprecated|заменено|вместо|instead of|may be accepted server-side|не[[:space:]]*[`'"'"']?birthCity|not[[:space:]]+birthCity' || true)
if [[ -n "$BIRTHCITY_HITS" ]]; then
  echo "FAIL: birthCity used as canonical in docs/ru/"
  echo "$BIRTHCITY_HITS" | head -3
  FAIL=$((FAIL + 1))
else
  echo "PASS: birthPlace canonical in docs/ru/"
  PASS=$((PASS + 1))
fi

# API doc coverage
API_DOC=docs/ru/API_CONTRACTS.md
for path in '/api/checkout/start' '/api/me/entitlements' '/api/public/surfaces' 'telegram/connect'; do
  check "API_CONTRACTS mentions $path" grep -q "$path" "$API_DOC"
done

# Env doc coverage
ENV_DOC=docs/ru/ENVIRONMENT_VARIABLES.md
for var in ASTRO_API_MODE PAYMENT_API_MODE PAYMENT_API_TOKEN TELEGRAM_BOT_SETUP_MODE TELEGRAM_TOKEN_ENCRYPTION_KEY ALLOW_STAGING_MOCKS COMMISSION_HOLD_DAYS; do
  check "ENVIRONMENT_VARIABLES documents $var" grep -q "$var" "$ENV_DOC"
done

# .env.example coverage
for var in TELEGRAM_BOT_SETUP_MODE TELEGRAM_TOKEN_ENCRYPTION_KEY COMMISSION_HOLD_DAYS; do
  check ".env.example contains $var" grep -q "$var" .env.example
done

# Legacy banners on moved docs
for f in docs/legacy/API_CONTRACTS.md docs/legacy/BACKEND_HANDOFF.md; do
  check "legacy banner on $(basename "$f")" grep -q "Исторический документ" "$f"
done

# English docs at root have RU pointer
for f in docs/CLOSED_PILOT_RUNBOOK.md docs/ENVIRONMENT_VARIABLES.md; do
  check "RU pointer on $(basename "$f")" grep -q "docs/ru/" "$f"
done

# FRONTEND_BACKEND_CONNECTION has required sections
FB_DOC=docs/ru/FRONTEND_BACKEND_CONNECTION.md
for section in "Mock mode" "Remote mode" "Правила безопасности" "Типичные ошибки"; do
  check "FRONTEND_BACKEND_CONNECTION has: $section" grep -q "$section" "$FB_DOC"
done

echo "=== Summary: ${PASS} passed, ${FAIL} failed ==="
if [[ "$FAIL" -gt 0 ]]; then
  exit 1
fi
exit 0
