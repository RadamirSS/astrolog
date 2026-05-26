# Astro API Contract (Report Schema V2)

Base URL (development): `http://localhost:8100`

**Internal service only.** Клиенты production (Mini App, Dashboard) вызывают **только SaaS API**, не Astro API напрямую.

SaaS API оркестрирует Astro API для free/paid report generation после валидации tenant, user session и (для paid) payment/entitlement.

Frontend и SaaS platform **не выполняют астрологические расчёты**. Astro backend отвечает за ephemeris, houses, aspects и генерацию контента отчёта.

---

## Endpoints

| Method | Path | Назначение |
|--------|------|------------|
| POST | `/v1/reports/free` | Генерация free mini-report |
| POST | `/v1/reports/paid` | Генерация paid report (после verify payment) |
| GET | `/v1/reports/{report_id}/status` | Poll статуса генерации |
| GET | `/v1/reports/{report_id}` | Получить готовый report payload |

Все ответы используют standard API envelope из `@astro/api-contracts`.

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
| `birth.birthPlace` | yes | City/place label (**не birthCity**) |
| `partner` | no | Attribution from resolved partner link |

**Birth time rule:** When `timeAccuracy` is `unknown` or `birthTime` is absent, Astro backend must **not** invent precise Ascendant, house cusps, or house placements.

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
| `productType` | yes | Approved catalog type |
| `theme` | no | Required for low-ticket products |

Approved types: `low_ticket_money`, `low_ticket_relationships`, `low_ticket_personality`, `bundle_all_topics`, `main_natal_portrait`

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
| `sections` | typed section array | yes |
| `actions` | action array | optional |
| `pdfUrl` | string | optional |

Legacy V1 fields (`type`, `summary`, `highlights`, `lockedSections`, `cta`, `recommendedProducts`, `generatedAt`) — **не часть V2**.

Canonical schema: `packages/tenant-config/src/schema.ts` → `reportV2Schema`.

---

## Integration boundaries

1. **SaaS не считает астрологию** — validates sessions, products, payments, entitlements.
2. **Paid reports не запрашиваются** до confirm payment.
3. **Unknown birth time** — no fake Ascendant/houses.
4. **Queue delays** — delivery depends on Astro backend capacity.

---

## Environment (SaaS side)

| Variable | Purpose |
|----------|---------|
| `ASTRO_API_MODE` | `mock` \| `remote` |
| `ASTRO_API_BASE_URL` | e.g. `http://localhost:8100` |
| `ASTRO_API_TOKEN` | Bearer token (production required) |
| `ASTRO_API_TIMEOUT_MS` | Request timeout |

Production forbids `ASTRO_API_MODE=mock`.

Client implementation: `services/saas-api/src/saas_api/services/astro_client.py`

---

## Health / version

- `GET /health` — liveness
- `GET /ready` — readiness
- `GET /version` — version info
