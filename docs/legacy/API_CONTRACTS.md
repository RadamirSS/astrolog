> **Исторический документ / Historical doc.** Актуальная версия: см. [docs/legacy/README.md](../legacy/README.md) для карты замены.

---

# API Contracts

Frontend/backend wire format for the Astro white-label astrology platform. Domain models live in `@astro/tenant-config`; this document describes HTTP contracts.

## Response envelope

All remote API responses use:

```json
{
  "ok": true,
  "data": { },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-05-23T12:00:00.000Z",
    "warnings": []
  }
}
```

Errors:

```json
{
  "ok": false,
  "error": {
    "code": "TENANT_NOT_FOUND",
    "message": "Tenant not found: unknown-slug",
    "details": {},
    "fieldErrors": {
      "slug": ["Slug is required"]
    }
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-05-23T12:00:00.000Z"
  }
}
```

TypeScript types: `@astro/api-contracts` — `ApiSuccess<T>`, `ApiFailure`, `ApiResponse<T>`, `unwrapApiResponse()`.

## Payload shape rule

The envelope is the **only** wrapper. Put domain objects directly in `data` (or send them as the raw request body).

| Correct | Incorrect |
|---------|-----------|
| `{ ok: true, data: TenantConfig }` | `{ ok: true, data: { config: TenantConfig } }` |
| `{ ok: true, data: ProductConfig[] }` | `{ ok: true, data: { products: [...] } }` |
| `{ ok: true, data: ProductConfig }` | `{ ok: true, data: { product: {...} } }` |
| `{ ok: true, data: TenantConfigStatus }` | `{ ok: true, data: { status: {...} } }` |

PUT draft config sends the **raw `TenantConfig` JSON** as the request body (not `{ config: ... }`).

Composite DTOs (e.g. `DashboardSummary`, `TenantListItem`) are the exception — they are defined explicitly in `@astro/api-contracts` because the frontend expects that enriched shape.

## Error codes

| Code | When |
|------|------|
| `VALIDATION_ERROR` | Invalid request body or field rules |
| `UNAUTHORIZED` | Missing/invalid auth (future) |
| `FORBIDDEN` | Not allowed for this tenant/user |
| `NOT_FOUND` | Generic resource not found |
| `TENANT_NOT_FOUND` | Unknown tenant slug or id |
| `TENANT_PAUSED` | Tenant exists but is paused |
| `CONFIG_INVALID` | Config/report/product failed schema validation |
| `REPORT_GENERATION_FAILED` | Report generation error |
| `PRODUCT_NOT_FOUND` | Unknown product id |
| `DRAFT_CONFLICT` | Draft save/restore conflict |
| `PUBLISH_FAILED` | Publish operation failed |
| `RATE_LIMITED` | Too many requests |
| `REMOTE_API_NOT_CONFIGURED` | Frontend remote mode without base URL |
| `UNKNOWN_ERROR` | Unexpected failure |

## Auth (placeholder)

MVP runs without real auth. Future backend should accept `Authorization: Bearer <token>` on dashboard/superadmin routes and scope `/api/me/*` to the authenticated user. No secrets in frontend env vars.

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/tenant/:slug/config` | Published config (optional `?preview=draft`) |
| GET | `/api/tenant/:slug/config/published` | Published config only |
| GET | `/api/tenant/:slug/products` | Active products list |
| GET | `/api/tenant/:slug/products/:productId` | Single product |
| GET | `/api/dashboard/tenants` | Tenant list (enriched summary) |
| GET | `/api/dashboard/tenants/:tenantId` | Tenant detail |
| POST | `/api/dashboard/tenants` | Create tenant |
| PATCH | `/api/dashboard/tenants/:tenantId` | Update tenant status |
| GET | `/api/dashboard/tenants/:tenantId/config/draft` | Draft config |
| PUT | `/api/dashboard/tenants/:tenantId/config/draft` | Save draft |
| GET | `/api/dashboard/tenants/:tenantId/config/published` | Published snapshot |
| GET | `/api/dashboard/tenants/:tenantId/config/status` | Draft/publish status |
| POST | `/api/dashboard/tenants/:tenantId/publish` | Publish draft |
| POST | `/api/dashboard/tenants/:tenantId/discard-draft` | Discard draft |
| POST | `/api/dashboard/tenants/:tenantId/restore-draft-from-published` | Restore draft from published |
| GET | `/api/dashboard/tenants/:tenantId/summary` | Dashboard summary DTO |
| GET | `/api/dashboard/tenants/:tenantId/stats` | Mock analytics stats |
| POST | `/api/me/birth-profile` | Save birth profile |
| GET | `/api/me/birth-profile?tenantId=&userId=` | Get birth profile |
| POST | `/api/reports/free` | Generate free report |
| GET | `/api/reports/:reportId` | Get report by id |
| GET | `/api/reports?tenantId=&userId=` | List reports |
| POST | `/api/analytics/events` | Track analytics events |

## Request/response examples (raw payloads)

### GET `/api/tenant/:slug/config`

Response:

```json
{
  "ok": true,
  "data": {
    "tenantId": "tenant_mystic",
    "slug": "mystic-dark",
    "status": "active",
    "version": 1,
    "brand": { "displayName": "Mystic Dark" },
    "theme": { "preset": "mystic-dark" },
    "content": { "home": { "headline": "Welcome", "ctaLabel": "Start" }, "onboarding": {} },
    "modules": { "onboarding": true, "freeReport": true, "products": true, "profile": true },
    "products": []
  }
}
```

(`data` is the full `TenantConfig` object — fields above are abbreviated.)

### PUT `/api/dashboard/tenants/:tenantId/config/draft`

Request body: raw `TenantConfig` (same shape as GET config `data`).

Response:

```json
{
  "ok": true,
  "data": {
    "tenantId": "tenant_mystic",
    "slug": "mystic-dark",
    "version": 2
  }
}
```

### GET `/api/tenant/:slug/products`

Response:

```json
{
  "ok": true,
  "data": [
    {
      "id": "prod_1",
      "slug": "natal-reading",
      "type": "natal",
      "title": "Natal Reading",
      "ctaLabel": "Book Now",
      "featured": true,
      "sortOrder": 0,
      "status": "active"
    }
  ]
}
```

### GET `/api/tenant/:slug/products/:productId`

Response:

```json
{
  "ok": true,
  "data": {
    "id": "prod_1",
    "slug": "natal-reading",
    "type": "natal",
    "title": "Natal Reading",
    "ctaLabel": "Book Now",
    "featured": true,
    "sortOrder": 0,
    "status": "active"
  }
}
```

### GET `/api/dashboard/tenants/:tenantId/config/status`

Response:

```json
{
  "ok": true,
  "data": {
    "hasUnpublishedChanges": true,
    "draftUpdatedAt": "2026-05-23T12:00:00.000Z",
    "lastPublishedAt": "2026-05-22T10:00:00.000Z",
    "publishedVersion": 1,
    "draftVersion": 2,
    "changedAreas": ["content"]
  }
}
```

### POST `/api/dashboard/tenants/:tenantId/publish`

Response `data`: raw `TenantConfig` (the newly published config).

## TenantConfig

Single source of truth: `@astro/tenant-config` `TenantConfig`. Validated with `tenantConfigSchema`.

Draft/publish stores `{ draft, published }` per tenant. Publish promotes draft → published and bumps version.

## Birth profile

Request body fields:

- `name`, `birthDate`, `birthTime?`, **`birthPlace`**, `topic?`
- `tenantId`, `userId` on POST

Topic values match `BirthProfileTopic` in tenant-config. **Note:** wire field is `birthPlace`, not `birthCity`.

## Report

Structured JSON for `@astro/report-renderer`. Required: `id`, `type`, `title`, `summary`, `highlights`, `sections`, `generatedAt`.

Backend may send `createdAt`; frontend normalizes to `generatedAt`. Optional: `subtitle`, `lockedSections`, `cta`, `recommendedProducts`.

Example request for free report:

```json
{
  "tenantId": "tenant_mystic",
  "userId": "user_123",
  "topic": "relationships"
}
```

## Product

Uses `ProductConfig` from tenant-config. No checkout or payment fields.

## Dashboard summary

`DashboardSummary` includes: tenant status, setup checklist, product/module counts, unpublished flag, timestamps, `configStatus`, integration statuses, optional analytics stats.

## Analytics events

Typed event names (see `@astro/api-contracts`):

**Mini app:** `miniapp_opened`, `tenant_home_viewed`, `onboarding_started`, `birth_profile_submitted`, `free_report_requested`, `free_report_viewed`, `product_list_viewed`, `product_clicked`, `product_cta_clicked`, `profile_viewed`

**Dashboard:** `dashboard_opened`, `dashboard_setup_started`, `dashboard_setup_completed`, `dashboard_brand_saved`, `dashboard_design_saved`, `dashboard_content_saved`, `dashboard_product_created`, `dashboard_product_updated`, `dashboard_product_deleted`, `dashboard_preview_opened`, `dashboard_publish_clicked`, `dashboard_config_published`, `dashboard_draft_discarded`

**Superadmin:** `superadmin_opened`, `superadmin_tenant_created`, `superadmin_tenant_status_changed`, `superadmin_tenant_preview_opened`

Payload shape:

```json
{
  "events": [{
    "eventName": "miniapp_opened",
    "tenantId": "tenant_mystic",
    "tenantSlug": "mystic-dark",
    "userId": "user_123",
    "sessionId": "sess_abc",
    "timestamp": "2026-05-23T12:00:00.000Z",
    "properties": {}
  }]
}
```

## Intentionally out of scope

- Real auth / JWT sessions
- Payments (Telegram Stars, Stripe, etc.)
- Astrology calculations / AI report generation
- Geocoding / timezone
- Database implementation
- PDF generation
