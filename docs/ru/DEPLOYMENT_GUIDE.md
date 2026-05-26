# Руководство по деплою

Деплой closed pilot (1–3 creators). Два пути: managed services и VPS/Docker.

---

## Multi-surface архитектура

```
Browser
  → apps/miniapp     (Website / Mobile Web / Telegram public)
  → apps/dashboard   (Creator Dashboard / Launch Studio)
  → apps/superadmin  (Platform admin)
       ↓ NEXT_PUBLIC_API_BASE_URL (remote mode only)
  → SaaS API :8000
       → PostgreSQL
       → Astro API :8100 (internal)
       → Payment API (external)
       → Telegram Bot API
       → Media storage
```

**Правила:**
- Frontend вызывает **только SaaS API**
- Astro API и Payment API — internal/external, не exposed to browser
- Три frontend app — три origin в `CORS_ORIGINS`
- Cookies: account (`saas_session`) и end-user (`saas_end_user_session`) — configure domain/secure

---

## Path A — Managed pilot

| Component | Host |
|-----------|------|
| Mini App, Dashboard, Superadmin | Vercel / similar |
| SaaS API | Render, Railway, Fly.io |
| Astro API | Same provider, internal URL |
| PostgreSQL | Neon, Supabase, RDS |
| Payment API | External service |
| Media | Local volume or S3/R2 |

### Steps

1. Create Postgres, note `DATABASE_URL`
2. Copy [`.env.staging.example`](../../.env.staging.example) to host secrets
3. Migrate & bootstrap:
   ```bash
   pnpm db:migrate:saas
   pnpm pilot:bootstrap
   ```
4. Deploy SaaS API — set all integration env vars (see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md))
5. Deploy Astro API — set `ASTRO_API_BASE_URL` on SaaS to internal URL
6. Configure Payment API — `PAYMENT_API_MODE=remote`, URL + token
7. Frontend (all 3 apps):
   ```
   NEXT_PUBLIC_API_MODE=remote
   NEXT_PUBLIC_API_BASE_URL=https://your-saas-api.example.com
   NEXT_PUBLIC_MINIAPP_URL=https://app.example.com
   NEXT_PUBLIC_DASHBOARD_URL=https://dashboard.example.com
   NEXT_PUBLIC_SUPERADMIN_URL=https://admin.example.com
   ```
8. `CORS_ORIGINS` — all three frontend URLs
9. Cookies: `SAAS_COOKIE_SECURE=true`, `SAAS_COOKIE_DOMAIN` if subdomains
10. Telegram: `TELEGRAM_BOT_SETUP_MODE=remote`, encryption key, BotFather Mini App URL
11. Verify:
    ```bash
    curl https://your-saas-api.example.com/health
    curl https://your-saas-api.example.com/ready
    pnpm pilot:preflight
    pnpm docs:check
    ```

---

## Path B — VPS + Docker Compose

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
pnpm pilot:bootstrap
```

Reverse proxy: [`infra/nginx/Caddyfile.example`](../../infra/nginx/Caddyfile.example)

### Local Docker dev

```bash
docker compose -f docker-compose.dev.yml up --build
pnpm pilot:bootstrap
```

Frontend on host:
```
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

---

## Service URLs

| Service | Port | Exposure |
|---------|------|----------|
| SaaS API | 8000 | Public to frontends |
| Astro API | 8100 | Internal only |
| Payment API | external | SaaS only |
| Mini App | 3000 | Public |
| Dashboard | 3001 | Public (auth) |
| Superadmin | 3002 | Restrict access |

---

## Health checks

| Endpoint | Purpose |
|----------|---------|
| `GET /health` | Process alive |
| `GET /ready` | DB reachable |
| `GET /version` | Build info |

Use `/ready` for load balancer probes.

---

## Pilot bootstrap

```bash
pnpm pilot:bootstrap
```

Creates admin, blogger, demo tenants, published configs, prints URLs.

---

## Rollback

1. Redeploy previous image / git tag
2. DB restore from backup if needed
3. Revert frontend deployment
4. Keep env snapshot — never commit secrets

---

## Security checklist

- `ALLOW_DEV_TELEGRAM_AUTH=false`
- `PAYMENT_API_MODE=remote`, `ASTRO_API_MODE=remote` in production
- Strong `SAAS_SESSION_SECRET`
- Explicit `CORS_ORIGINS`
- `SAAS_COOKIE_SECURE=true`
- Superadmin restricted
- No secrets in git

---

## Related

- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
- [QA_CHECKLIST.md](./QA_CHECKLIST.md)
- [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
