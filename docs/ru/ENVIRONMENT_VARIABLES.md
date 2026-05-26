# Переменные окружения

Справочник для деплоя Astro Platform. Шаблоны:

- [`.env.example`](../../.env.example) — local development (mock default)
- [`.env.staging.example`](../../.env.staging.example) — staging pilot
- [`.env.production.example`](../../.env.production.example) — production pilot

**Never commit** real `.env`, `.env.local`, `.env.staging`, `.env.production`.

---

## Разделение: кто видит что

| Scope | Переменные | Где |
|-------|------------|-----|
| **Frontend public** | `NEXT_PUBLIC_*` | Browser, Next.js apps |
| **SaaS API secrets** | `SAAS_SESSION_SECRET`, `DATABASE_URL`, `PAYMENT_API_TOKEN`, `ASTRO_API_TOKEN`, `TELEGRAM_TOKEN_ENCRYPTION_KEY` | Server only |
| **Astro API internal** | `ASTRO_API_*` on SaaS side | SaaS → Astro |
| **Payment API external** | `PAYMENT_API_*` | SaaS → Payment API |
| **Telegram storage** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_TOKEN_ENCRYPTION_KEY` | SaaS only |

Frontend **never** receives `ASTRO_API_TOKEN`, `PAYMENT_API_TOKEN`, creator Telegram bot tokens.

---

## Frontend (Next.js)

| Variable | Description | Dev | Staging/Prod |
|----------|-------------|-----|--------------|
| `NEXT_PUBLIC_API_MODE` | `mock` or `remote` | `mock` | `remote` |
| `NEXT_PUBLIC_API_BASE_URL` | SaaS API URL | empty in mock | HTTPS |
| `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` | Mini App default tenant | demo slug | pilot slug |
| `NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID` | Dashboard default tenant | demo id | pilot id |
| `NEXT_PUBLIC_DEFAULT_LOCALE` | `en` or `ru` | `en` | as needed |
| `NEXT_PUBLIC_MINIAPP_URL` | Mini App public URL | localhost:3000 | HTTPS |
| `NEXT_PUBLIC_DASHBOARD_URL` | Dashboard URL | localhost:3001 | HTTPS |
| `NEXT_PUBLIC_SUPERADMIN_URL` | Superadmin URL | localhost:3002 | internal HTTPS |
| `NEXT_PUBLIC_APP_URL` | Base for payment return URLs | localhost:3000 | HTTPS |

---

## SaaS API — core

| Variable | Description | Production rule |
|----------|-------------|-----------------|
| `APP_ENV` | `development`, `staging`, `production` | Set explicitly |
| `SERVICE_NAME` | `saas-api` | — |
| `APP_VERSION` | Release version | — |
| `SAAS_API_PORT` | Listen port | 8000 |
| `DATABASE_URL` | PostgreSQL URL | Required staging/prod |
| `SAAS_SESSION_SECRET` | Session signing | Strong unique value |
| `SAAS_COOKIE_NAME` | Account cookie | default `saas_session` |
| `SAAS_COOKIE_SECURE` | HTTPS-only cookies | `true` staging/prod |
| `SAAS_COOKIE_SAMESITE` | `lax`, `strict`, `none` | `lax` typical |
| `SAAS_COOKIE_DOMAIN` | Cookie domain | e.g. `.example.com` |
| `SAAS_SESSION_TTL_HOURS` | Account session TTL | default 168 |
| `CORS_ORIGINS` | Comma-separated frontend origins | Explicit list, no `*` |
| `END_USER_COOKIE_NAME` | End-user cookie | default `saas_end_user_session` |
| `END_USER_SESSION_TTL_HOURS` | End-user TTL | default 168 |

---

## SaaS API — Astro integration

| Variable | Description | Production rule |
|----------|-------------|-----------------|
| `ASTRO_API_MODE` | `mock` or `remote` | **`remote` required** in production |
| `ASTRO_API_BASE_URL` | Internal Astro URL | Required if remote |
| `ASTRO_API_TOKEN` | Bearer token | **Required** in production if remote |
| `ASTRO_API_TIMEOUT_MS` | Request timeout ms | default 30000 |
| `ASTRO_API_TIMEOUT_SECONDS` | Legacy timeout (seconds) | default 20 |

Note: both `TIMEOUT_MS` and `TIMEOUT_SECONDS` exist — prefer `ASTRO_API_TIMEOUT_MS` for new configs.

---

## SaaS API — Payment integration

| Variable | Description | Production rule |
|----------|-------------|-----------------|
| `PAYMENT_API_MODE` | `mock` or `remote` | **`remote` required** in production |
| `PAYMENT_API_BASE_URL` | Payment API URL | Required if remote |
| `PAYMENT_API_TOKEN` | Bearer token | **Required** in production if remote |
| `PAYMENT_API_TIMEOUT_MS` | Request timeout | default 30000 |
| `ALLOW_STAGING_MOCKS` | Allow mock modes in staging | `false` in production |
| `MINIAPP_PUBLIC_BASE_URL` | Payment return URL base | HTTPS in prod |
| `PAYMENT_SUCCESS_PATH` | Success return path | default `/payment/success` |
| `PAYMENT_CANCEL_PATH` | Cancel return path | |
| `PAYMENT_PENDING_PATH` | Pending return path | |

---

## SaaS API — Telegram

| Variable | Description | Production rule |
|----------|-------------|-----------------|
| `TELEGRAM_BOT_TOKEN` | Platform/dev bot token | Required in production |
| `TELEGRAM_BOT_SETUP_MODE` | Creator bot connect: `mock` or `remote` | `remote` in prod |
| `TELEGRAM_TOKEN_ENCRYPTION_KEY` | Fernet key for stored creator tokens | Required when remote setup |
| `ALLOW_DEV_TELEGRAM_AUTH` | Dev initData bypass | **`false`** staging/prod |

---

## SaaS API — Finance

| Variable | Description | Default |
|----------|-------------|---------|
| `COMMISSION_HOLD_DAYS` | Hold before commission release | 7 |
| `PLATFORM_DEFAULT_COMMISSION_RATE` | Default partner rate | 0.5 |

---

## SaaS API — Media

| Variable | Description |
|----------|-------------|
| `MEDIA_STORAGE_PROVIDER` | `local` (pilot) |
| `MEDIA_LOCAL_ROOT` | Local media directory |
| `MEDIA_PUBLIC_BASE_URL` | Public URL prefix |
| `MEDIA_MAX_UPLOAD_MB` | Upload limit (default 5) |

---

## Astro API service

| Variable | Description |
|----------|-------------|
| `APP_ENV` | Environment |
| `SERVICE_NAME` | `astro-api` |
| `ASTRO_API_PORT` | 8100 |
| `CORS_ORIGINS` | SaaS API is primary caller |

Astro API **must not** be exposed to browsers.

---

## Bootstrap seed accounts

| Variable | Description |
|----------|-------------|
| `SAAS_BOOTSTRAP_ADMIN_EMAIL` | Platform owner email |
| `SAAS_BOOTSTRAP_ADMIN_PASSWORD` | Platform owner password |
| `SAAS_BOOTSTRAP_BLOGGER_EMAIL` | Creator email |
| `SAAS_BOOTSTRAP_BLOGGER_PASSWORD` | Creator password |

Change before any shared/staging deploy.

---

## Production validation

`services/backend-common/src/backend_common/production_checks.py`:

- Production forbids `PAYMENT_API_MODE=mock`, `ASTRO_API_MODE=mock`
- Remote requires `*_BASE_URL`; production requires `*_TOKEN`
- Staging mocks require `ALLOW_STAGING_MOCKS=true`
- `ALLOW_DEV_TELEGRAM_AUTH=false` in staging/prod
- Non-default `SAAS_SESSION_SECRET`
- `CORS_ORIGINS` must not include `*`

---

## Related

- [INTEGRATIONS.md](./INTEGRATIONS.md)
- [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
