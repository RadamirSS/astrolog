# Deployment Guide

BE-05 deployment guide for closed pilot (1–3 bloggers). Supports two paths: managed services (fast) and VPS/Docker.

## Architecture

```
Browser → Frontend apps (Vercel/host)
       → SaaS API (Render/Railway/Fly/VPS)
       → PostgreSQL
       → Astro API (internal only)
       → Media storage (local volume or S3/R2)
```

**Rule:** Frontend must never call Astro API directly. All browser traffic goes to SaaS API.

## Path A — Fast managed pilot

| Component | Suggested host |
|-----------|----------------|
| Mini App, Dashboard, Superadmin | Vercel (or similar) |
| SaaS API | Render, Railway, or Fly.io |
| Astro API | Same provider, private/internal URL |
| PostgreSQL | Managed Postgres (Neon, Supabase, RDS) |
| Media | Local volume on SaaS API or S3/R2-compatible bucket |

### Steps

1. **Database** — Create Postgres, note connection string.
2. **Env** — Copy [`.env.staging.example`](../.env.staging.example) to your host secrets.
3. **Migrate & bootstrap:**
   ```bash
   pnpm db:migrate:saas
   pnpm pilot:bootstrap
   ```
4. **Deploy SaaS API** — Docker image from [`services/saas-api/Dockerfile`](../services/saas-api/Dockerfile) or run with uvicorn. Set env vars from template.
5. **Deploy Astro API** — [`services/astro-api/Dockerfile`](../services/astro-api/Dockerfile). Set `ASTRO_API_BASE_URL` on SaaS API to internal Astro URL.
6. **Frontend** — Set per-app env on Vercel:
   ```
   NEXT_PUBLIC_API_MODE=remote
   NEXT_PUBLIC_API_BASE_URL=https://your-saas-api.example.com
   ```
7. **CORS** — Set `CORS_ORIGINS` to all three frontend URLs.
8. **Cookies** — `SAAS_COOKIE_SECURE=true`, configure `SAAS_COOKIE_DOMAIN` if using subdomains.
9. **Telegram** — Set `TELEGRAM_BOT_TOKEN`, configure Mini App URL in BotFather.
10. **Verify:**
    ```bash
    curl https://your-saas-api.example.com/health
    curl https://your-saas-api.example.com/ready
    pnpm smoke:local  # with SAAS_API_BASE_URL set
    ```

## Path B — VPS + Docker Compose

1. Provision VPS with Docker and Docker Compose.
2. Copy [`.env.staging.example`](../.env.staging.example) → `.env.staging`, fill secrets.
3. Start stack:
   ```bash
   docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
   ```
4. Put Caddy/Nginx in front — see [`infra/nginx/Caddyfile.example`](../infra/nginx/Caddyfile.example).
5. Deploy frontends separately or serve static builds from the VPS.
6. Run bootstrap inside SaaS container or from host with `DATABASE_URL` set:
   ```bash
   pnpm pilot:bootstrap
   ```

### Local Docker dev stack

```bash
cp .env.example .env.local
docker compose -f docker-compose.dev.yml up --build
pnpm pilot:bootstrap   # from host, with DATABASE_URL pointing at localhost:5432
```

Frontend on host with remote mode:

```
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

## Service URLs

| Service | Default local | Notes |
|---------|---------------|-------|
| SaaS API | `:8000` | Public to frontends |
| Astro API | `:8100` | Internal only |
| Mini App | `:3000` | |
| Dashboard | `:3001` | |
| Superadmin | `:3002` | Restrict in production |

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Process alive |
| `GET /ready` | SaaS: DB reachable; Astro: booted |
| `GET /version` | Build/environment info |

Use `/ready` for load balancer readiness probes.

## Database migrations

Always run before app start:

```bash
pnpm db:migrate:saas
# or inside Docker entrypoint (automatic for saas-api container)
```

## Pilot bootstrap

```bash
pnpm pilot:bootstrap
```

Creates platform owner, blogger owner, 3 demo tenants with draft + published configs, integration statuses, and prints pilot URLs.

## Media storage

**Pilot default:** local filesystem at `MEDIA_LOCAL_ROOT` (default `var/media`), served at `MEDIA_PUBLIC_BASE_URL`.

- Mount a persistent volume in Docker/production.
- For multi-instance SaaS API, migrate to S3/R2-compatible storage (documented for future; not fully implemented in BE-05).

## Rollback

1. Redeploy previous container image / git tag.
2. Database: restore from backup if schema/data migration failed (see Backup below).
3. Frontend: revert Vercel deployment to previous build.
4. Env: keep previous env snapshot; never commit secrets to git.

## Backup and export

### Postgres

```bash
PSQL_URL="${DATABASE_URL/postgresql+psycopg/postgresql}"
pg_dump "$PSQL_URL" -Fc -f astro_saas_backup.dump
```

Restore:

```bash
pg_restore -d astro_saas astro_saas_backup.dump
```

### Media

Backup the `MEDIA_LOCAL_ROOT` directory or S3/R2 bucket prefix.

### Tenant configs

```bash
DATABASE_URL=postgresql+psycopg://... bash scripts/export-tenant-configs.sh > tenant-configs.json
```

### Audit logs

Audit logs are stored in `audit_logs` table. Define retention policy for pilot (e.g. 90 days) and archive via `pg_dump` or read via superadmin `GET /api/admin/audit-logs`.

## Security checklist

- `ALLOW_DEV_TELEGRAM_AUTH=false` in staging/production
- Strong `SAAS_SESSION_SECRET`
- Explicit `CORS_ORIGINS`
- `SAAS_COOKIE_SECURE=true`
- Superadmin not publicly open — platform role only
- No secrets in git
- Astro API not exposed to browsers

## Related docs

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
- [PILOT_QA_CHECKLIST.md](./PILOT_QA_CHECKLIST.md)
