# API Contracts — индекс

Актуальные HTTP-контракты SaaS API. Источник типов: `packages/api-contracts/src/`.

**Детали:** [SAAS_API_CONTRACT.md](./SAAS_API_CONTRACT.md) · [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md) · [PAYMENT_API_CONTRACT.md](./PAYMENT_API_CONTRACT.md)

---

## Envelope (все ответы SaaS API)

```json
{
  "ok": true,
  "data": {},
  "meta": {
    "requestId": "...",
    "timestamp": "..."
  }
}
```

Ошибка:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "..."
  },
  "meta": { "requestId": "..." }
}
```

---

## 1. Public surfaces

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/public/surfaces/{type}/{slug}` | none |
| GET | `/api/public/partners/{slug}` | none |
| GET | `/api/public/miniapps/{slug}` | none (alias) |
| GET | `/api/tenant/{slug}/config` | none |
| GET | `/api/tenant/{slug}/config/published` | none |
| GET | `/api/tenant/{slug}/products` | none |
| GET | `/api/tenant/{slug}/products/{productId}` | none |

---

## 2. Creator mini-app (Dashboard)

Prefix: `/api/dashboard/tenants/{tenantId}`

| Method | Path |
|--------|------|
| GET | `/mini-app` |
| PUT | `/mini-app` |
| POST | `/mini-app/publish` |
| POST | `/mini-app/unpublish` |
| PUT | `/surfaces/{surfaceId}` |
| PUT | `/mini-app/surfaces/{surfaceType}/enabled` |
| POST | `/surfaces/{surfaceId}/publish` |
| GET | `/surfaces/{surfaceId}/preview` |

---

## 3. Telegram

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/dashboard/tenants/{tenantId}/telegram/connect` | account |
| POST | `.../telegram/disconnect` | account |
| POST | `.../telegram/validate` | account |
| GET | `.../telegram/status` | account |
| POST | `/api/telegram/validate-init-data` | none → end-user cookie |
| POST | `/api/telegram/webhook/{integrationId}` | none (placeholder) |

---

## 4. Reports

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/reports/free` | end-user |
| GET | `/api/reports` | end-user |
| GET | `/api/reports/{reportId}` | end-user |

**Free report request:**

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

Используйте **`birthPlace`**, не `birthCity`.

---

## 5. Checkout

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/checkout/start` | end-user |
| GET | `/api/checkout/{orderId}` | end-user |
| POST | `/api/checkout/{orderId}/confirm-return` | end-user |

**StartCheckoutRequest** (strict — лишние поля отклоняются):

```json
{
  "tenantId": "tenant_mystic",
  "tenantSlug": "mystic-dark",
  "productId": "prod_money",
  "productType": "low_ticket_money",
  "theme": "money",
  "locale": "ru",
  "birth": {
    "name": "Anna",
    "birthDate": "1998-06-16",
    "birthTime": "14:30",
    "timeAccuracy": "exact",
    "birthPlace": "Milan"
  }
}
```

**Запрещено в public checkout request:** `amount`, `currency`, `productTitle`, `price`, `commission`.

**StartCheckoutResponse:**

```json
{
  "orderId": "ord_...",
  "paymentId": "pay_...",
  "paymentUrl": "https://...",
  "status": "payment_pending",
  "entitlementId": "ent_..."
}
```

**ConfirmPaymentReturnRequest:**

```json
{
  "orderId": "ord_...",
  "returnState": "success"
}
```

`returnState`: `success` | `cancel` | `pending` | `failed`

---

## 6. Entitlements

| Method | Path | Query |
|--------|------|-------|
| GET | `/api/me/entitlements` | `tenantId` (required) |
| GET | `/api/me/reports/{reportId}/access` | `tenantId` (required) |

---

## 7. Premium requests

**End-user** — prefix `/api/me/premium-requests`:

| Method | Path |
|--------|------|
| POST | `/` |
| GET | `/` |
| GET | `/{requestId}` |

**Dashboard ops** — prefix `/api/dashboard/tenants/{tenantId}/ops/premium-requests`:

| Method | Path |
|--------|------|
| GET | `/` |
| GET | `/{requestId}` |
| PATCH | `/{requestId}` |

---

## 8. Dashboard ops (finance)

Prefix: `/api/dashboard/tenants/{tenantId}/ops`

| Group | Endpoints |
|-------|-----------|
| Orders | `GET /orders`, `GET /orders/{id}`, `POST .../sync-payment`, `POST .../approve-mock-payment`, `POST .../sync-report`, `POST .../retry-report`, `POST .../mark-refunded`, entitlement revoke/unlock |
| Revenue | `GET /revenue` |
| Partners | `GET /partners`, `GET /partners/{id}`, `GET /partners/{id}/finance` |
| Commissions | `GET /commissions`, `GET /commissions/summary`, `POST /commissions/{id}/release`, `POST .../hold` |
| Payouts | `GET /payouts`, `POST /payouts`, `PATCH /payouts/{id}` |
| Payments | `GET /payments`, `GET /payments/{id}` |
| Balances | `GET /balances`, `GET /balances/{partnerId}`, `GET .../verify`, `POST .../adjustments` |
| Ledger | `GET /ledger` |
| Analytics | `GET /funnel-analytics`, `GET /product-economics`, `GET /promo-materials` |

---

## 9. Auth

| Method | Path |
|--------|------|
| POST | `/auth/login` |
| POST | `/auth/logout` |
| GET | `/auth/me` |

Login body: `{ "email": "...", "password": "..." }`

---

## 10. Current user / birth profile

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/me` | end-user |
| GET | `/api/me/birth-profile` | end-user |
| POST | `/api/me/birth-profile` | end-user |

---

## 11. Dashboard tenant config (legacy builder)

| Method | Path |
|--------|------|
| GET | `/api/dashboard/tenants` |
| POST | `/api/dashboard/tenants` |
| GET/PATCH | `/api/dashboard/tenants/{id}` |
| GET/PUT | `.../config/draft` |
| GET | `.../config/published` |
| GET | `.../config/status` |
| POST | `.../publish` |
| POST | `.../discard-draft` |
| POST | `.../restore-draft-from-published` |
| GET | `.../summary`, `.../stats`, `.../metrics` |

---

## 12. Analytics & admin

| Method | Path |
|--------|------|
| POST | `/api/analytics/events` |
| GET | `/api/admin/tenants/{id}/health` |
| GET | `/api/admin/audit-logs` |

---

## 13. Health

| Method | Path |
|--------|------|
| GET | `/`, `/health`, `/ready`, `/version` |

---

## Approved productType values

`free_report`, `low_ticket_money`, `low_ticket_relationships`, `low_ticket_personality`, `bundle_all_topics`, `main_natal_portrait`, `premium_consultation`

Legacy types (`natal`, `purpose`, `career`, etc.) — deprecated.

---

## Endpoint path constants

`packages/api-contracts/src/endpoints.ts`

## Contract schemas

`packages/api-contracts/src/` — Zod schemas per domain module.
