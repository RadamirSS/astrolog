> **Исторический / English doc.** Актуальная версия: [docs/ru/ASTRO_API_CONTRACT.md](./ru/ASTRO_API_CONTRACT.md)

---

# Astro API Contract (Report Schema V2)

Base URL (development): `http://localhost:8100`

**Internal service only.** Production clients (Mini App, Dashboard) must call **SaaS API**, not Astro API directly.

SaaS API orchestrates Astro API for free and paid report generation after validating tenant, user session, and (for paid) payment/entitlement.

The frontend and SaaS platform **do not calculate astrology**. The external Astro backend is responsible for ephemeris, houses, aspects, and report content generation.

---

## Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/v1/reports/free` | Generate free mini-report |
| POST | `/v1/reports/paid` | Generate paid report (after platform payment verification) |
| GET | `/v1/reports/{report_id}/status` | Poll generation status |
| GET | `/v1/reports/{report_id}` | Fetch completed report payload |

All responses use the standard API envelope from `@astro/api-contracts`.

---

## POST `/v1/reports/free`

### Request body

```json
{
  "tenantId": "tenant_mystic",
  "userId": "eu_abc123",
  "sessionId": "eu_abc123",
  "theme": "relationships",
  "locale": "ru",
  "birth": {
    "name": "Anna",
    "birthDate": "1998-06-16",
    "birthTime": "14:30",
    "timeAccuracy": "exact",
    "birthPlace": "Milan"
  },
  "partner": {
    "partnerId": "partner_nicole",
    "partnerSlug": "nicole",
    "campaignId": null
  }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `tenantId` | yes | Tenant identifier |
| `userId` / `sessionId` | yes | End-user reference from SaaS session |
| `theme` | no | `money`, `relationships`, `personality` |
| `locale` | no | `en` or `ru` |
| `birth.name` | yes | Display name |
| `birth.birthDate` | yes | ISO date `YYYY-MM-DD` |
| `birth.birthTime` | no | `HH:MM` when known |
| `birth.timeAccuracy` | yes | `exact`, `approximate`, or `unknown` |
| `birth.birthPlace` | yes | City/place label |
| `partner` | no | Attribution from resolved partner link |

**Birth time rule:** When `timeAccuracy` is `unknown` or `birthTime` is absent, the Astro backend must **not** invent precise Ascendant, house cusps, or house placements.

---

## POST `/v1/reports/paid`

Called by SaaS **only after** payment is verified and entitlement is in `paid_generating`.

```json
{
  "tenantId": "tenant_mystic",
  "userId": "eu_abc123",
  "sessionId": "eu_abc123",
  "orderId": "ord_abc123",
  "entitlementId": "ent_abc123",
  "productType": "low_ticket_relationships",
  "theme": "relationships",
  "locale": "ru",
  "birth": { "...": "same as free" },
  "partner": { "...": "optional" }
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `orderId` | yes | SaaS order reference |
| `entitlementId` | yes | SaaS entitlement reference |
| `productType` | yes | Approved catalog type (e.g. `main_natal_portrait`) |
| `theme` | no | Required for low-ticket products |

---

## GET `/v1/reports/{report_id}/status`

### Response `data`

```json
{
  "reportId": "rpt_abc123",
  "status": "processing",
  "progress": 45,
  "errorCode": null,
  "errorMessage": null,
  "updatedAt": "2026-05-25T10:00:00.000Z"
}
```

| `status` | Meaning |
|----------|---------|
| `queued` | Accepted, not started |
| `processing` | Generation in progress |
| `ready` | Report available via GET report |
| `failed` | Terminal error |

---

## GET `/v1/reports/{report_id}`

Returns **Report Schema V2** in `data`:

```json
{
  "schemaVersion": 2,
  "id": "rpt_abc123",
  "productType": "low_ticket_relationships",
  "level": "low_ticket",
  "theme": "relationships",
  "title": "Код отношений",
  "subtitle": "Понимание отношенческих сценариев",
  "visualPack": "pink_love",
  "status": "ready",
  "sections": [
    {
      "id": "section_1",
      "type": "hero",
      "title": "...",
      "content": "...",
      "order": 0
    }
  ],
  "actions": [
    {
      "id": "action_1",
      "type": "buy_product",
      "label": "Открыть полный портрет",
      "productType": "main_natal_portrait"
    }
  ],
  "pdfUrl": null,
  "createdAt": "2026-05-25T10:00:00.000Z",
  "updatedAt": "2026-05-25T10:05:00.000Z"
}
```

### Report Schema V2 fields

| Field | Type | Required |
|-------|------|----------|
| `schemaVersion` | `2` | yes |
| `id` | string | yes |
| `productType` | RealProductType | yes |
| `level` | ProductLevel | yes |
| `theme` | FunnelTopic | optional |
| `title` | string | yes |
| `subtitle` | string | optional |
| `visualPack` | VisualPack | yes |
| `status` | `ready` \| `generating` \| `failed` | yes |
| `sections` | typed section array (`id`, `type`, `title`, `content`, `order`) | yes |
| `actions` | action array (`id`, `type`, `label`, optional `productType`) | optional |
| `pdfUrl` | string | optional |
| `createdAt` | ISO datetime | optional |
| `updatedAt` | ISO datetime | optional |

Legacy V1 fields (`type`, `summary`, `highlights`, `lockedSections`, `cta`, `recommendedProducts`, `generatedAt`) are **not** part of V2.

Canonical TypeScript schema: `packages/tenant-config/src/schema.ts` → `reportV2Schema`.

---

## Integration boundaries

1. **SaaS does not calculate astrology** — it validates sessions, products, payments, entitlements, and persists orders/reports.
2. **Paid reports are not requested** until SaaS confirms payment (remote payment API or admin mock approval in allowed environments).
3. **Unknown birth time** must not produce fake precise Ascendant/houses in generated content.
4. **Queue delays** — report delivery depends on external Astro backend capacity; not guaranteed instant.

---

## Health / version

- `GET /health` — service liveness
- `GET /version` — service version and environment

See SaaS orchestration in `services/saas-api/src/saas_api/services/astro_client.py`.
