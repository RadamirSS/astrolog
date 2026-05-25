#!/usr/bin/env bash
set -euo pipefail

cd /app/services/saas-api

echo "Waiting for database..."
until python - <<'PY'
import os
import sys

from sqlalchemy import create_engine, text

url = os.environ.get("DATABASE_URL", "")
if not url.strip():
    sys.exit(1)
try:
    engine = create_engine(url)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
except Exception:
    sys.exit(1)
PY
do
  sleep 2
done

echo "Running migrations..."
alembic upgrade head

echo "Starting SaaS API..."
exec uvicorn saas_api.main:app --host 0.0.0.0 --port "${SAAS_API_PORT:-8000}"
