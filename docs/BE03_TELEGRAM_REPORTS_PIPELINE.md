# BE-03 — Telegram Runtime + Reports Pipeline

## Overview

BE-03 turns the Mini App runtime into a real Telegram-backed user flow and connects SaaS API to Astro API for structured report generation.

```
Mini App → SaaS API → Astro API
              ↓
         PostgreSQL (end_users, birth_profiles, reports)
```

The frontend never calls Astro API directly.

## Telegram initData validation

1. Mini App reads `Telegram.WebApp.initData` (not `initDataUnsafe` for identity).
2. Frontend calls `POST /api/telegram/validate-init-data` with `{ tenantSlug, initData }`.
3. SaaS API validates HMAC-SHA256 signature using `TELEGRAM_BOT_TOKEN`.
4. SaaS API upserts `end_users` row and sets httpOnly cookie `saas_end_user_session`.
5. Subsequent `/api/me/*` and `/api/reports/*` calls use the end-user cookie.

### Dev fallback (non-production only)

When **all** of the following are true:

- `APP_ENV=development`
- `ALLOW_DEV_TELEGRAM_AUTH=true`
- `TELEGRAM_BOT_TOKEN` is empty

The API accepts documented dev initData:

```
dev_mode=1&dev_user_id=123456789&dev_first_name=Dev&dev_last_name=User&dev_username=devuser&dev_language_code=en
```

**Warning:** Never enable `ALLOW_DEV_TELEGRAM_AUTH` in production.

Outside Telegram in development, `@astro/telegram` returns the same dev initData string when `NODE_ENV=development`.

### Remote mode auth failure (BE-03-FIX)

In `NEXT_PUBLIC_API_MODE=remote`, failed Telegram validation **does not** fall back to a synthetic mock user id.

- Mock mode: synthetic user id is allowed.
- Preview mode: preview session is allowed.
- Remote mode: auth failure shows a user-facing error screen and blocks `/api/me`, `/api/me/birth-profile`, and `/api/reports/*` calls.

## Public runtime tenant status (BE-03-FIX)

Public Mini App runtime endpoints allow **active tenants only**:

| Tenant status | Public runtime result |
|---------------|----------------------|
| `active` | Allowed |
| `paused` | `403 TENANT_PAUSED` |
| `draft` | `403 FORBIDDEN` — "Tenant is not published" |

Applies to public config/products endpoints, Telegram validation, and report generation tenant checks. Dashboard endpoints can still access draft tenants.

## End-user session

- Separate from dashboard auth cookie (`saas_session`).
- JWT stored in httpOnly cookie `saas_end_user_session` (configurable via `END_USER_COOKIE_NAME`).
- Payload claim `kind: "end_user"` distinguishes from admin sessions.
- Tokens are not stored in localStorage.

## Database models

### `end_users`

Tenant-scoped Telegram users. Unique on `(tenant_id, telegram_id)`.

### `birth_profiles`

One active profile per end user (upsert on save). Stores `birth_city` internally; API accepts `birthCity` or `birthPlace`.

### `reports`

Report lifecycle with status: `pending` → `generating` → `completed` | `failed`.

Fields include `request_json`, `report_json`, `error_code`, `error_message`, `completed_at`.

## Report lifecycle

1. `POST /api/reports/free` creates report as `pending`.
2. Status set to `generating`.
3. SaaS API loads published tenant config and calls Astro API `POST /v1/reports/free`.
4. Astro response validated (required: `id`, `type`, `title`, `summary`, `highlights`, `sections`, `generatedAt`).
5. On success: save `report_json`, set `completed`, return raw report in envelope `data`.
6. On failure/timeout/invalid shape: set `failed`, save error fields, return `REPORT_GENERATION_FAILED`.

Generation is synchronous (no background queue in BE-03).

## SaaS → Astro API flow

Internal httpx client (`ASTRO_API_BASE_URL`, `ASTRO_API_TIMEOUT_SECONDS`).

SaaS builds Astro payload from:

- Tenant id/slug
- Locale (`en` / `ru`)
- Birth profile (maps `birthPlace` → `birthCity`)
- Style profile from published config brand (`tone`, `brandVoice`)

## API endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/telegram/validate-init-data` | No | Validate initData, create session |
| GET | `/api/me` | End-user cookie | Current end user |
| GET | `/api/me/birth-profile` | End-user cookie | Get birth profile |
| POST | `/api/me/birth-profile` | End-user cookie | Save birth profile |
| POST | `/api/reports/free` | End-user cookie | Generate free report |
| GET | `/api/reports` | End-user cookie | Report history |
| GET | `/api/reports/{id}` | End-user cookie | Report detail or status |

Paused tenants return `403 TENANT_PAUSED` on runtime endpoints.

## Frontend remote mode

Mini App remote mode (optional, additive):

```bash
# .env.local
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Backend env (SaaS API):

```bash
TELEGRAM_BOT_TOKEN=
ALLOW_DEV_TELEGRAM_AUTH=true
ASTRO_API_BASE_URL=http://localhost:8100
ASTRO_API_TIMEOUT_SECONDS=20
```

Default remains `NEXT_PUBLIC_API_MODE=mock`. Mock mode is unchanged.

## Failure states

| Status | GET `/api/reports/{id}` returns |
|--------|--------------------------------|
| `pending` / `generating` | Status object (no report JSON) |
| `completed` | Full report JSON in `data` |
| `failed` | Status object with `errorCode` / `errorMessage` |

### Report status API contract (BE-03-FIX)

- `getReport(reportId)` — returns a completed `Report` only; throws if the report is not ready.
- `getReportStatus(reportId)` — returns `ReportStatusResponse` for any lifecycle state (handles both completed report JSON and status payloads from the same endpoint).

## Limitations

- No payments, media uploads, or analytics persistence (BE-04+).
- No real astrology calculations in SaaS API.
- No PDF generation.
- Single birth profile per end user (latest wins).
- Dev Telegram bypass is development-only.

## Verification commands

```bash
pnpm db:migrate:saas
pnpm test:backend
pnpm typecheck
pnpm lint
pnpm build
```

## Manual curl examples

```bash
# Dev auth
curl -c cookies.txt -X POST http://localhost:8000/api/telegram/validate-init-data \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"mystic-dark","initData":"dev_mode=1&dev_user_id=123456789&dev_first_name=Dev&dev_language_code=en"}'

curl -b cookies.txt http://localhost:8000/api/me

curl -b cookies.txt -X POST http://localhost:8000/api/me/birth-profile \
  -H 'Content-Type: application/json' \
  -d '{"name":"Anna","birthDate":"1998-06-16","birthCity":"Milan","topic":"relationships","locale":"en"}'

curl -b cookies.txt -X POST http://localhost:8000/api/reports/free \
  -H 'Content-Type: application/json' \
  -d '{"tenantSlug":"mystic-dark","locale":"en","birthProfile":{"name":"Anna","birthDate":"1998-06-16","birthCity":"Milan","topic":"relationships","locale":"en"}}'

curl -b cookies.txt http://localhost:8000/api/reports
```
