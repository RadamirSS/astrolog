# SaaS API Contract

Детальный контракт Platform API (`services/saas-api`, port 8000).

**Индекс:** [API_CONTRACTS.md](./API_CONTRACTS.md)

---

## Base URL

- Development: `http://localhost:8000`
- Staging/Production: см. `NEXT_PUBLIC_API_BASE_URL`

OpenAPI: `http://localhost:8000/docs`

---

## Response envelope

Все endpoints возвращают:

```json
{
  "ok": true,
  "data": { },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

---

## Authentication

### Dashboard accounts

- `POST /auth/login` — `{ email, password }` → `{ account }` + `saas_session` cookie
- `GET /auth/me` — current account
- `POST /auth/logout` — clears cookie

Roles: `platform_owner`, `platform_admin`, `creator`, `viewer`

### End users

- `POST /api/telegram/validate-init-data` — Telegram Mini App
- Session cookie: `END_USER_COOKIE_NAME` (default `saas_end_user_session`)
- Dev bypass: `ALLOW_DEV_TELEGRAM_AUTH=true`

---

## Public surfaces

### GET `/api/public/surfaces/{surface_type}/{slug}`

Returns `PublicSurfaceResponse`: published mini-app config, products, partner, surface metadata.

Path `surface_type`: `telegram`, `website`, `mobile` (API shorthand).

### GET `/api/public/partners/{slug}` / `/api/public/miniapps/{slug}`

Legacy resolver — same underlying service. Returns partner + mini-app public config.

---

## Tenant public config

### GET `/api/tenant/{slug}/config`

Published tenant config. Query `?preview=draft` — **403** on server.

### GET `/api/tenant/{slug}/products`

Active products from approved catalog, filtered by tenant enablement.

---

## Creator mini-app

All require account session + tenant access.

### GET `/api/dashboard/tenants/{tenantId}/mini-app`

Returns draft creator mini-app configuration.

### PUT `/api/dashboard/tenants/{tenantId}/mini-app`

Save draft. Body: mini-app config JSON.

### POST `.../mini-app/publish`

Promote draft → published.

### POST `.../mini-app/unpublish`

Revert published state.

### PUT `.../surfaces/{surfaceId}`

Update surface configuration.

### PUT `.../mini-app/surfaces/{surfaceType}/enabled`

Body: `{ "enabled": true|false }`

---

## Reports

### POST `/api/reports/free`

Body:

```json
{
  "tenantSlug": "mystic-dark",
  "birthProfile": {
    "name": "Anna",
    "birthDate": "1998-06-16",
    "birthTime": "14:30",
    "timeAccuracy": "exact",
    "birthPlace": "Milan"
  },
  "locale": "ru"
}
```

Orchestrates Astro API `POST /v1/reports/free`, persists report, returns Report Schema V2.

### GET `/api/reports`

List user's reports for session.

### GET `/api/reports/{reportId}`

Full report if ready; otherwise status response.

---

## Checkout

### POST `/api/checkout/start`

Strict schema — no `amount`, `currency`, `productTitle`, `price`, `commission`.

SaaS resolves price from `approved_product_catalog.py`.

Creates order, payment (via Payment API), entitlement, returns `paymentUrl`.

### GET `/api/checkout/{orderId}`

Order detail: statuses, payment URL, entitlement/report status.

### POST `/api/checkout/{orderId}/confirm-return`

Verifies payment via Payment API. On paid: updates entitlement, triggers paid report generation.

---

## Entitlements

### GET `/api/me/entitlements?tenantId=`

List entitlements for end-user in tenant.

### GET `/api/me/reports/{reportId}/access?tenantId=`

```json
{
  "allowed": true,
  "reason": null,
  "entitlementStatus": "ready"
}
```

---

## Premium requests

### POST `/api/me/premium-requests`

Create request. Required: `tenantId`, `tenantSlug`, `productType`, `productTitle`, `topic`, `personalQuestion`, `consentAccepted`.

### Dashboard ops

`GET/PATCH /api/dashboard/tenants/{tenantId}/ops/premium-requests[/{requestId}]`

PATCH body: `{ status?, assignedExpert?, adminNote?, finalPdfUrl? }`

---

## Dashboard ops (finance)

Prefix: `/api/dashboard/tenants/{tenantId}/ops`

Requires ops/finance role. Creators scoped to own `partner_id`.

Key RPC-style actions:
- `POST /orders/{id}/sync-payment`
- `POST /orders/{id}/approve-mock-payment` (admin, mock mode)
- `POST /commissions/{id}/release`
- `POST /payouts` — create manual payout
- `PATCH /payouts/{id}` — `{ action: "approve"|"paid"|"failed"|"cancel" }`

See [API_CONTRACTS.md](./API_CONTRACTS.md) for full list.

---

## Analytics

### POST `/api/analytics/events`

Body: `{ "events": [ AnalyticsEventPayload, ... ] }`

Returns: `{ "accepted": true }`

---

## Media

### POST `/api/dashboard/tenants/{tenantId}/media`

Multipart: `file`, `kind`. Returns `MediaAsset`.

Storage: `MEDIA_STORAGE_PROVIDER=local` (default) or future S3.

---

## Birth profile

Uses **`birthPlace`** field. Legacy alias `birthCity` may be accepted server-side but **do not use in new clients**.

---

## Environment variables (SaaS API)

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

Key groups: `DATABASE_URL`, `SAAS_SESSION_SECRET`, `CORS_ORIGINS`, `ASTRO_API_*`, `PAYMENT_API_*`, `TELEGRAM_*`, `COMMISSION_HOLD_DAYS`, `PLATFORM_DEFAULT_COMMISSION_RATE`.

---

## Related

- [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md)
- [PAYMENT_API_CONTRACT.md](./PAYMENT_API_CONTRACT.md)
- [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
