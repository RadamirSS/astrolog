#!/usr/bin/env bash
# Export published tenant configs from Postgres (read-only).
#
# Usage:
#   DATABASE_URL=postgresql+psycopg://... bash scripts/export-tenant-configs.sh > tenant-configs.json
#
# Requires psql and a DATABASE_URL in SQLAlchemy format (postgresql+psycopg://).

set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required" >&2
  exit 1
fi

PSQL_URL="${DATABASE_URL/postgresql+psycopg/postgresql}"

psql "$PSQL_URL" -At -c "
SELECT json_agg(row_to_json(t))
FROM (
  SELECT tenants.slug,
         tenant_configs.version,
         tenant_configs.config_json AS config,
         tenant_configs.published_at
  FROM tenant_configs
  JOIN tenants ON tenants.id = tenant_configs.tenant_id
  WHERE tenant_configs.kind = 'published'
  ORDER BY tenants.slug
) t;
"
