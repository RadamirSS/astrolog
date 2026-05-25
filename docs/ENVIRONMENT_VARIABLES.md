# Environment Variables

Reference for Astro Platform deployment. Templates:

- [`.env.example`](../.env.example) — local development (mock mode default)
- [`.env.staging.example`](../.env.staging.example) — staging pilot
- [`.env.production.example`](../.env.production.example) — production pilot

Never commit real `.env`, `.env.local`, `.env.staging`, or `.env.production` files.

## Frontend

| Variable | Description | Dev | Staging/Prod |
|----------|-------------|-----|--------------|
| `NEXT_PUBLIC_API_MODE` | `mock` or `remote` | `mock` | `remote` |
| `NEXT_PUBLIC_API_BASE_URL` | SaaS API URL for remote mode | empty in mock | HTTPS API URL |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | Mini App default tenant | demo slug | pilot slug |
| `NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID` | Dashboard default tenant id | demo id | pilot id |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` or `ru` | `en` | as needed |
| `NEXT_PUBLIC_MINIAPP_URL` | Mini App public URL | localhost:3000 | HTTPS |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard public URL | localhost:3001 | HTTPS |
| `NEXT_PUBLIC_SUPERADMIN_URL` | Superadmin URL (restrict access) | localhost:3002 | internal HTTPS |

Mock mode remains available for frontend-only development without a backend.

## SaaS API

| Variable | Description | Production rule |
|----------|-------------|-----------------|
| `APP_ENV` | `development`, `staging`, or `production` | Set explicitly |
| `SERVICE_NAME` | `saas-api` | — |
| `APP_VERSION` | Release version string | — |
| `DATABASE_URL` | PostgreSQL SQLAlchemy URL | Required in staging/prod |
| `SAAS_SESSION_SECRET` | JWT/session signing secret | Strong unique value; not dev default |
| `SAAS_COOKIE_NAME` | Session cookie name | default `saas_session` |
| `SAAS_COOKIE_SECURE` | HTTPS-only cookies | `true` in staging/prod |
| `SAAS_COOKIE_SAMESITE` | `lax`, `strict`, or `none` | `lax` typical for cross-subdomain |
| `SAAS_COOKIE_DOMAIN` | Cookie domain (optional) | e.g. `.example.com` |
| `CORS_ORIGINS` | Comma-separated frontend origins | Explicit list only |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Required in production |
| `ALLOW_DEV_TELEGRAM_AUTH` | Dev session bypass | **Must be `false`** in staging/prod |
| `ASTRO_API_BASE_URL` | Internal Astro API URL | Internal network URL |
| `ASTRO_API_TIMEOUT_SECONDS` | Report generation timeout | 20 default |
| `MEDIA_STORAGE_PROVIDER` | `local` (pilot) | local or future S3/R2 |
| `MEDIA_LOCAL_ROOT` | Local media directory | persistent volume in Docker |
| `MEDIA_PUBLIC_BASE_URL` | Public URL prefix for media | HTTPS API `/media` path |
| `MEDIA_MAX_UPLOAD_MB` | Upload size limit | 5 default |

Startup validation (SaaS API) enforces production rules when `APP_ENV=production` or `APP_ENV=staging`:

- `ALLOW_DEV_TELEGRAM_AUTH=false`
- Non-default `SAAS_SESSION_SECRET`
- `DATABASE_URL` set
- `SAAS_COOKIE_SECURE=true` when `APP_ENV=production`
- `CORS_ORIGINS` must not include `*`
- `TELEGRAM_BOT_TOKEN` required in production (warning only in staging)

## Astro API

| Variable | Description |
|----------|-------------|
| `APP_ENV` | Environment name |
| `SERVICE_NAME` | `astro-api` |
| `APP_VERSION` | Release version |
| `CORS_ORIGINS` | Origins (SaaS API is primary caller) |
| `ASTRO_API_PORT` | Listen port (8100) |

Astro API must not be exposed as a frontend runtime dependency. Browsers call SaaS API only.

## Bootstrap

| Variable | Description |
|----------|-------------|
| `SAAS_BOOTSTRAP_ADMIN_EMAIL` | Platform owner email for seed |
| `SAAS_BOOTSTRAP_ADMIN_PASSWORD` | Platform owner password |
| `SAAS_BOOTSTRAP_BLOGGER_EMAIL` | Blogger owner email |
| `SAAS_BOOTSTRAP_BLOGGER_PASSWORD` | Blogger owner password |

Rotate bootstrap credentials after initial pilot setup.

## Cookie and CORS setup

For cross-origin frontends (e.g. Vercel) calling a separate API domain:

1. Set `CORS_ORIGINS` to exact frontend URLs (no wildcards).
2. Set `SAAS_COOKIE_SECURE=true` and `SAAS_COOKIE_SAMESITE=lax` (or `none` + Secure if cross-site cookies required).
3. Set `SAAS_COOKIE_DOMAIN` when sharing cookies across subdomains.
4. Ensure frontend uses `credentials: "include"` in remote API client (already configured).

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for full deployment paths.
