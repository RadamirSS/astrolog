#!/usr/bin/env bash
# Smoke test local/staging backend stack.
#
# Prerequisites:
#   - SaaS API and Astro API running
#   - Database migrated and seeded (pnpm pilot:bootstrap)
#
# Usage:
#   pnpm smoke:local
#
# Environment overrides:
#   SAAS_API_BASE_URL=http://localhost:8000
#   ASTRO_API_BASE_URL=http://localhost:8100
#   SMOKE_TENANT_SLUG=mystic-dark
#   SMOKE_TENANT_ID=tenant_mystic
#   SMOKE_ADMIN_EMAIL=admin@astro.local
#   SMOKE_ADMIN_PASSWORD=admin123!

set -euo pipefail

SAAS_API_BASE_URL="${SAAS_API_BASE_URL:-http://localhost:8000}"
ASTRO_API_BASE_URL="${ASTRO_API_BASE_URL:-http://localhost:8100}"
SMOKE_TENANT_SLUG="${SMOKE_TENANT_SLUG:-mystic-dark}"
SMOKE_TENANT_ID="${SMOKE_TENANT_ID:-tenant_mystic}"
SMOKE_ADMIN_EMAIL="${SMOKE_ADMIN_EMAIL:-admin@astro.local}"
SMOKE_ADMIN_PASSWORD="${SMOKE_ADMIN_PASSWORD:-admin123!}"
COOKIE_JAR="$(mktemp)"
trap 'rm -f "$COOKIE_JAR"' EXIT

pass=0
fail=0

check_json_ok() {
  local name="$1"
  local url="$2"
  if response="$(curl -sf "$url")" && echo "$response" | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
    echo "PASS  $name"
    pass=$((pass + 1))
  else
    echo "FAIL  $name ($url)"
    fail=$((fail + 1))
    return 1
  fi
}

echo "Smoke testing SaaS API at $SAAS_API_BASE_URL"
echo "Smoke testing Astro API at $ASTRO_API_BASE_URL"
echo ""

check_json_ok "SaaS /health" "$SAAS_API_BASE_URL/health"
check_json_ok "SaaS /version" "$SAAS_API_BASE_URL/version"
check_json_ok "SaaS /ready" "$SAAS_API_BASE_URL/ready"
check_json_ok "Astro /health" "$ASTRO_API_BASE_URL/health"
check_json_ok "Astro /version" "$ASTRO_API_BASE_URL/version"
check_json_ok "Astro /ready" "$ASTRO_API_BASE_URL/ready"

if curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$SAAS_API_BASE_URL/auth/login" \
  -d "{\"email\":\"$SMOKE_ADMIN_EMAIL\",\"password\":\"$SMOKE_ADMIN_PASSWORD\"}" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  SaaS auth login"
  pass=$((pass + 1))
else
  echo "FAIL  SaaS auth login"
  fail=$((fail + 1))
fi

if curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" "$SAAS_API_BASE_URL/api/dashboard/tenants" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  dashboard tenants"
  pass=$((pass + 1))
else
  echo "FAIL  dashboard tenants"
  fail=$((fail + 1))
fi

if curl -sf "$SAAS_API_BASE_URL/api/tenant/$SMOKE_TENANT_SLUG/config" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  public tenant config"
  pass=$((pass + 1))
else
  echo "FAIL  public tenant config"
  fail=$((fail + 1))
fi

ASTRO_PAYLOAD=$(cat <<EOF
{
  "tenantId": "$SMOKE_TENANT_ID",
  "tenantSlug": "$SMOKE_TENANT_SLUG",
  "locale": "en",
  "reportType": "free",
  "birthProfile": {
    "name": "Smoke Test",
    "birthDate": "1990-01-15",
    "birthCity": "London"
  },
  "styleProfile": {
    "tone": "warm",
    "brandVoice": "supportive"
  }
}
EOF
)

if curl -sf -H "Content-Type: application/json" \
  -X POST "$ASTRO_API_BASE_URL/v1/reports/free" \
  -d "$ASTRO_PAYLOAD" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  Astro report stub"
  pass=$((pass + 1))
else
  echo "FAIL  Astro report stub"
  fail=$((fail + 1))
fi

ANALYTICS_PAYLOAD=$(cat <<EOF
{
  "events": [
    {
      "eventName": "miniapp_opened",
      "tenantId": "$SMOKE_TENANT_ID",
      "tenantSlug": "$SMOKE_TENANT_SLUG",
      "properties": { "source": "smoke-local.sh" }
    }
  ]
}
EOF
)

if curl -sf -H "Content-Type: application/json" \
  -X POST "$SAAS_API_BASE_URL/api/analytics/events" \
  -d "$ANALYTICS_PAYLOAD" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  analytics events"
  pass=$((pass + 1))
else
  echo "FAIL  analytics events"
  fail=$((fail + 1))
fi

METRICS_RESPONSE="$(curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  "$SAAS_API_BASE_URL/api/dashboard/tenants/$SMOKE_TENANT_ID/metrics?period=7d" || true)"
if echo "$METRICS_RESPONSE" | grep -q '"ok"[[:space:]]*:[[:space:]]*true' \
  && echo "$METRICS_RESPONSE" | grep -q '"visits"'; then
  echo "PASS  analytics metrics (visits)"
  pass=$((pass + 1))
else
  echo "FAIL  analytics metrics (visits)"
  fail=$((fail + 1))
fi

if curl -sf -c "$COOKIE_JAR" -b "$COOKIE_JAR" \
  "$SAAS_API_BASE_URL/api/dashboard/tenants/$SMOKE_TENANT_ID/media" \
  | grep -q '"ok"[[:space:]]*:[[:space:]]*true'; then
  echo "PASS  media list"
  pass=$((pass + 1))
else
  echo "FAIL  media list"
  fail=$((fail + 1))
fi

echo ""
echo "Summary: $pass passed, $fail failed"

if [[ "$fail" -gt 0 ]]; then
  exit 1
fi
