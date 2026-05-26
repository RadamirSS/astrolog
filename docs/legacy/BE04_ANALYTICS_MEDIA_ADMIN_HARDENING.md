> **Исторический документ / Historical doc.** Актуальная версия: см. [docs/legacy/README.md](../legacy/README.md) для карты замены.

---

# BE-04 — Analytics, Media, and Pilot Admin Hardening

## Overview

BE-04 adds the operational layer required for a closed pilot with 1–3 bloggers:

- Analytics event ingestion and persistence
- Dashboard metrics from real DB aggregates
- Tenant-scoped media uploads (local filesystem in development)
- Superadmin tenant health and audit log visibility
- Dynamic integration status reporting

Payments, subscriptions, marketplace, PDF generation, real astrology calculations, and deployment infrastructure remain out of scope.

## Analytics ingestion

**Endpoint:** `POST /api/analytics/events`

**Request:**

```json
{
  "events": [
    {
      "eventName": "miniapp_opened",
      "tenantId": "tenant_mystic",
      "tenantSlug": "mystic-dark",
      "userId": "end_user_123",
      "sessionId": "sess_abc",
      "timestamp": "2026-05-23T12:00:00Z",
      "properties": { "locale": "en" }
    }
  ]
}
```

**Response:**

```json
{ "ok": true, "data": { "accepted": true } }
```

Rules:

- Known event names from `@astro/api-contracts` are stored
- Unknown event names are skipped (no crash)
- Optional dashboard or end-user session attaches `actor_account_id` / `end_user_id`
- `tenantSlug` resolves to `tenant_id` when `tenantId` is omitted

Events are stored in `analytics_events` with source inferred from event name prefix.

## Metrics definitions

**Endpoint:** `GET /api/dashboard/tenants/{tenantId}/metrics?period=7d|30d`

| Metric | Source |
|--------|--------|
| visits | `miniapp_opened` events |
| onboardingStarts | `onboarding_started` |
| birthProfilesSubmitted | `birth_profile_submitted` |
| freeReportsRequested | `free_report_requested` |
| freeReportsViewed | `free_report_viewed` |
| productClicks | `product_clicked` |
| productCtaClicks | `product_cta_clicked` |
| reportsGenerated | `reports` with `status=completed` |
| reportFailures | `reports` with `status=failed` |

Conversion ratios are computed as safe ratios between funnel steps.

Legacy `GET .../stats` remains for backward compatibility and derives from 7-day metrics.

## Media upload and storage

**Endpoints:**

- `POST /api/dashboard/tenants/{tenantId}/media` — multipart upload
- `GET /api/dashboard/tenants/{tenantId}/media` — list active assets
- `DELETE /api/dashboard/tenants/{tenantId}/media/{assetId}` — soft delete

**Validation:**

- MIME: `image/jpeg`, `image/png`, `image/webp`
- Max size: `MEDIA_MAX_UPLOAD_MB` (default 5)
- Tenant-scoped; cross-tenant access blocked

**Local development:**

```
MEDIA_STORAGE_PROVIDER=local
MEDIA_LOCAL_ROOT=var/media
MEDIA_PUBLIC_BASE_URL=http://localhost:8000/media
MEDIA_MAX_UPLOAD_MB=5
```

Files are stored under `services/saas-api/var/media/{tenantId}/` and served at `/media/{tenantId}/{filename}`.

## Superadmin health cards

**Endpoint:** `GET /api/admin/tenants/{tenantId}/health`

Platform owner/admin only. Returns tenant status, config flags, product/module counts, recent analytics and report failures (7d), integration statuses, media asset counts, and warnings.

**Audit logs:** `GET /api/admin/audit-logs?tenantId=&action=&limit=50`

## Integration statuses

Computed at read time:

| Module | Status logic |
|--------|--------------|
| analytics | `active` |
| backendApi | `active` |
| reportGeneration | `active` when Astro API configured |
| telegram | `active` when `TELEGRAM_BOT_TOKEN` set |
| payments | `coming_later` |

## Frontend changes

- Dashboard brand editor and setup wizard support media upload in remote mode
- Dashboard overview shows live metrics in remote mode; mock mode keeps demo stats
- Superadmin tenant detail shows pilot health cards, dynamic integrations, audit snippet
- Remote analytics payload mapping fixed in `@astro/api-client`

## Limitations

- No rate limiting on analytics ingestion
- No S3/R2 implementation (storage abstraction only)
- Soft delete leaves local files on disk
- No image dimension extraction (width/height nullable)
- No complex audit search UI

## Future S3/R2

Set `MEDIA_STORAGE_PROVIDER=s3` or `r2` and add credentials env vars in a future package. BE-04 ships local storage only.

## Migration

```bash
pnpm db:migrate:saas
```

Adds migration `003_be04_analytics_media` with `analytics_events` and `media_assets` tables.

## Tests

```bash
pnpm test:backend
pytest services/saas-api/tests/test_be04.py -q
```

## Out of scope (confirmed)

- Payments / Telegram Stars / Stripe / subscriptions
- Real astrology calculations
- Deployment infrastructure
- PDF generation
