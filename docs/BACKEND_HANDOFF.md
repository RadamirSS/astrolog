# Backend Handoff

Guide for backend developers implementing the Astro platform API.

## Frontend defaults

- `NEXT_PUBLIC_API_MODE=mock` — all apps use `@astro/mock-api` via `@astro/api-client`. **No backend required for development.**
- `NEXT_PUBLIC_API_MODE=remote` — frontend calls `NEXT_PUBLIC_API_BASE_URL` with envelope responses.
- If remote mode is set but `NEXT_PUBLIC_API_BASE_URL` is empty, the client throws `REMOTE_API_NOT_CONFIGURED` (no silent failures).

## Base URL

Set in `.env.local`:

```
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=https://api.example.com
```

All paths below are relative to this base.

## Required MVP endpoints

Implement endpoints listed in [API_CONTRACTS.md](./API_CONTRACTS.md). Priority order:

1. Tenant config (GET published, GET/PUT draft, status, publish/discard/restore)
2. Dashboard tenant list + detail
3. Birth profile (GET/POST `/api/me/birth-profile`)
4. Free report (POST `/api/reports/free`, GET by id)
5. Products (list + detail by tenant slug)
6. Dashboard summary
7. Analytics events ingest (store or forward — frontend sends typed events)

## Response format

Always wrap success in `{ ok: true, data: T, meta?: {} }` and errors in `{ ok: false, error: { code, message, ... } }`.

Use standard error codes from `ApiErrorCode` in `@astro/api-contracts`.

## Important payload rule

All successful responses use `{ ok: true, data: T }`. Put the domain object **directly** in `data`.

**Correct:**

```json
{ "ok": true, "data": { "tenantId": "tenant_mystic", "slug": "mystic-dark" } }
```

**Incorrect:**

```json
{ "ok": true, "data": { "config": { "tenantId": "tenant_mystic" } } }
```

Same rule for requests where the body is a single domain object:

- PUT draft config → request body is raw `TenantConfig`, not `{ config: TenantConfig }`
- GET products → `data` is `ProductConfig[]`, not `{ products: [...] }`
- GET product detail → `data` is `ProductConfig`, not `{ product: {...} }`
- GET config status → `data` is `TenantConfigStatus`, not `{ status: {...} }`

The remote adapter in `@astro/api-client` validates these raw shapes. Extra wrappers will fail validation or break the frontend.

Composite response types (`DashboardSummary`, `TenantListItem`) are documented separately — use those exact shapes when the endpoint returns an enriched view, not a bare domain model.

## Draft / published behavior

- Each tenant has a working **draft** and optional **published** snapshot.
- `GET .../config/status` returns `hasUnpublishedChanges`, `changedAreas`, timestamps, versions.
- `POST .../publish` copies draft → published and increments version.
- `POST .../discard-draft` and `POST .../restore-draft-from-published` reset draft to published.

Frontend dashboard already implements confirmation UX for destructive actions.

## Report generation

- Backend responsibility: astrology calculations, AI, or templated content.
- Frontend expects **structured JSON** matching `Report` in `@astro/tenant-config` — not raw markdown/HTML strings alone.
- Use `generatedAt` (or `createdAt` alias accepted by frontend validator).
- Mock fixtures in `@astro/mock-api` show expected shape for `@astro/report-renderer`.

## TenantConfig

Do not redefine the config schema on the backend — mirror `@astro/tenant-config` types and validate with equivalent rules. Single source of truth is the shared package (copy schema or generate from OpenAPI derived from it).

## Birth profile

Fields: `name`, `birthDate`, `birthTime?`, `birthPlace`, `topic?`. No geocoding or timezone in MVP.

## Payments

**Future scope.** Frontend shows `coming_later` integration status. Do not expect payment keys or checkout flows in this package.

## Auth & secrets

- Frontend must not receive secret keys (payment providers, bot tokens, AI keys).
- Placeholder: dashboard/superadmin routes will use Bearer token or session cookie in a later package.
- `/api/me/*` should eventually bind to authenticated Telegram/user identity.

## Validation

Frontend remote adapter validates responses for `TenantConfig`, `Report`, `ProductConfig`, `TenantConfigStatus`, `DashboardSummary`. Invalid payloads surface as `CONFIG_INVALID` — align backend output with schemas in `@astro/api-contracts` / `@astro/tenant-config`.

## Local development workflow

1. Backend developer implements endpoints against [API_CONTRACTS.md](./API_CONTRACTS.md).
2. Set frontend `NEXT_PUBLIC_API_MODE=remote` and point base URL to local server.
3. Compare behavior with mock mode for parity.

## Contract package

Import `@astro/api-contracts` in a monorepo backend or copy types/schemas as the implementation reference. Keeps frontend and backend aligned without duplicating `TenantConfig`.
