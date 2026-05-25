# SaaS API Contract

Base URL (development): `http://localhost:8000`

All responses use the standard API envelope from `@astro/api-contracts`.

## Response envelope

### Success

```json
{
  "ok": true,
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-05-23T12:00:00.000Z"
  }
}
```

### Failure

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": null,
    "fieldErrors": { "field": ["message"] }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-05-23T12:00:00.000Z"
  }
}
```

Error codes match `ApiErrorCode` in `@astro/api-contracts`.

## Health endpoints

### GET `/health`

**Response `data`:** `{ "service": "saas-api", "status": "ok" }`

### GET `/version`

**Response `data`:** `{ "service": "saas-api", "version": "0.1.0", "environment": "development" }`

### GET `/`

**Response `data`:** `{ "service": "saas-api", "version": "0.1.0", "docs": "/docs" }`

## Auth (BE-02)

Session cookie: httpOnly JWT (`SAAS_COOKIE_NAME`, default `saas_session`).

| Method | Path | Auth | Response `data` |
|--------|------|------|-----------------|
| POST | `/auth/login` | No | `{ "account": { "id", "email", "role" } }` |
| POST | `/auth/logout` | No | `{}` |
| GET | `/auth/me` | Cookie | `{ "id", "email", "role" }` |

Unauthenticated `/auth/me` → `401 UNAUTHORIZED`.

## Dashboard / Superadmin (BE-02)

All require session cookie unless noted.

| Method | Path | Role | Response `data` |
|--------|------|------|-----------------|
| GET | `/api/dashboard/tenants` | member/platform | `TenantListItem[]` |
| POST | `/api/dashboard/tenants` | platform_owner | `TenantRecord` |
| GET | `/api/dashboard/tenants/{tenantId}` | member/platform | `TenantDetail` |
| PATCH | `/api/dashboard/tenants/{tenantId}` | platform_owner | `TenantRecord` (body: `{ status }`) |
| GET | `/api/dashboard/tenants/{tenantId}/bundle` | member/platform | `{ draft, published }` |
| GET | `/api/dashboard/tenants/{tenantId}/config/draft` | member/platform | `TenantConfig` |
| PUT | `/api/dashboard/tenants/{tenantId}/config/draft` | owner/platform | `TenantConfig` |
| GET | `/api/dashboard/tenants/{tenantId}/config/published` | member/platform | `TenantConfig \| null` |
| GET | `/api/dashboard/tenants/{tenantId}/config/status` | member/platform | `TenantConfigStatus` |
| POST | `/api/dashboard/tenants/{tenantId}/publish` | owner/platform | `TenantConfig` |
| POST | `/api/dashboard/tenants/{tenantId}/discard-draft` | owner/platform | `TenantConfig` |
| POST | `/api/dashboard/tenants/{tenantId}/restore-draft-from-published` | owner/platform | `TenantConfig` |
| GET | `/api/dashboard/tenants/{tenantId}/stats` | member/platform | `DashboardStats` (stub) |
| GET | `/api/dashboard/tenants/{tenantId}/summary` | member/platform | `DashboardSummary` |

Invalid config → `400 CONFIG_INVALID`.

## Public tenant (BE-02)

No auth required. Published config only.

| Method | Path | Response `data` |
|--------|------|-----------------|
| GET | `/api/tenant/{slug}/config` | `TenantConfig` (published) |
| GET | `/api/tenant/{slug}/config/published` | `TenantConfig \| null` |
| GET | `/api/tenant/{slug}/products` | `ProductConfig[]` |
| GET | `/api/tenant/{slug}/products/{productId}` | `ProductConfig` |

Errors: `TENANT_NOT_FOUND`, `TENANT_PAUSED`, `PRODUCT_NOT_FOUND`.

## Telegram runtime (BE-03)

End-user session cookie: httpOnly JWT (`END_USER_COOKIE_NAME`, default `saas_end_user_session`).

| Method | Path | Auth | Response `data` |
|--------|------|------|-----------------|
| POST | `/api/telegram/validate-init-data` | No | `{ "user": EndUserSummary }` |
| GET | `/api/me` | End-user cookie | `EndUserSummary` |

**Validate initData request:**

```json
{
  "tenantSlug": "mystic-dark",
  "initData": "raw Telegram initData string"
}
```

Errors: `UNAUTHORIZED` (invalid/missing initData), `TENANT_NOT_FOUND`, `TENANT_PAUSED`.

## Birth profile (BE-03)

Requires end-user session cookie.

| Method | Path | Response `data` |
|--------|------|-----------------|
| GET | `/api/me/birth-profile` | `BirthProfile` |
| POST | `/api/me/birth-profile` | `BirthProfile` |

**POST body:**

```json
{
  "name": "Anna",
  "birthDate": "1998-06-16",
  "birthTime": "14:30",
  "birthCity": "Milan",
  "topic": "relationships",
  "locale": "en"
}
```

Accepts `birthPlace` as alias for `birthCity`.

**Active MVP topics:** `money`, `relationships`, `personality`.

**Deprecated (do not use in new integrations):** `purpose`, `career`, `family`, `personal-path`, `compatibility`.

## Reports (BE-03)

Requires end-user session cookie.

| Method | Path | Response `data` |
|--------|------|-----------------|
| POST | `/api/reports/free` | Full `Report` JSON |
| GET | `/api/reports` | `ReportListItem[]` |
| GET | `/api/reports/{reportId}` | `Report` if completed, else status object |

**POST `/api/reports/free` body:**

```json
{
  "tenantSlug": "mystic-dark",
  "locale": "en",
  "birthProfile": {
    "name": "Anna",
    "birthDate": "1998-06-16",
    "birthCity": "Milan",
    "topic": "relationships",
    "locale": "en"
  }
}
```

Errors: `REPORT_GENERATION_FAILED`, `TENANT_PAUSED`, `UNAUTHORIZED`, `NOT_FOUND`.

Report lifecycle statuses: `pending`, `generating`, `completed`, `failed`.

## Analytics (BE-04)

| Method | Path | Auth | Response `data` |
|--------|------|------|-----------------|
| POST | `/api/analytics/events` | Optional | `{ accepted: true }` |

Batch request body matches `@astro/api-contracts` `TrackAnalyticsEventsRequest`.

## Dashboard metrics (BE-04)

| Method | Path | Auth | Response `data` |
|--------|------|------|-----------------|
| GET | `/api/dashboard/tenants/{tenantId}/metrics?period=7d\|30d` | Tenant member or platform admin | `DashboardMetrics` |

## Media (BE-04)

| Method | Path | Auth | Response `data` |
|--------|------|------|-----------------|
| POST | `/api/dashboard/tenants/{tenantId}/media` | Tenant owner or platform admin | `MediaAsset` |
| GET | `/api/dashboard/tenants/{tenantId}/media` | Tenant member or platform admin | `MediaAsset[]` |
| DELETE | `/api/dashboard/tenants/{tenantId}/media/{assetId}` | Tenant owner or platform admin | `{ deleted, id }` |

Multipart form fields: `file`, `kind` (`avatar` \| `logo` \| `cover` \| `product` \| `other`).

## Admin (BE-04)

Platform owner/admin only.

| Method | Path | Response `data` |
|--------|------|-----------------|
| GET | `/api/admin/tenants/{tenantId}/health` | `TenantHealth` |
| GET | `/api/admin/audit-logs?tenantId=&action=&limit=` | `AuditLogItem[]` |

## Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql+psycopg://...` | PostgreSQL connection |
| `SAAS_SESSION_SECRET` | (required in prod) | JWT signing secret |
| `SAAS_COOKIE_NAME` | `saas_session` | Dashboard session cookie |
| `END_USER_COOKIE_NAME` | `saas_end_user_session` | Mini App end-user cookie |
| `TELEGRAM_BOT_TOKEN` | (empty) | Telegram bot token for initData HMAC |
| `ALLOW_DEV_TELEGRAM_AUTH` | `false` | Dev-only initData bypass |
| `ASTRO_API_BASE_URL` | `http://localhost:8100` | Internal Astro API URL |
| `ASTRO_API_TIMEOUT_SECONDS` | `20` | Astro client timeout |
| `MEDIA_STORAGE_PROVIDER` | `local` | Media backend (`local` in BE-04) |
| `MEDIA_LOCAL_ROOT` | `var/media` | Local media directory |
| `MEDIA_PUBLIC_BASE_URL` | `http://localhost:8000/media` | Public media URL prefix |
| `MEDIA_MAX_UPLOAD_MB` | `5` | Max upload size |
| `SAAS_COOKIE_SECURE` | `false` | Secure cookie flag |
| `SAAS_COOKIE_SAMESITE` | `lax` | SameSite policy |
| `SAAS_BOOTSTRAP_*` | see `.env.example` | Seed account credentials |
| `APP_ENV` | `development` | Environment name |
| `CORS_ORIGINS` | localhost:3000–3002 | Allowed origins |

See [BE02_SAAS_PERSISTENCE_AUTH.md](./BE02_SAAS_PERSISTENCE_AUTH.md), [BE03_TELEGRAM_REPORTS_PIPELINE.md](./BE03_TELEGRAM_REPORTS_PIPELINE.md), and [BE04_ANALYTICS_MEDIA_ADMIN_HARDENING.md](./BE04_ANALYTICS_MEDIA_ADMIN_HARDENING.md).
