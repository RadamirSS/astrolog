> **Исторический документ / Historical doc.** Актуальная версия: см. [docs/legacy/README.md](../legacy/README.md) для карты замены.

---

# Backend Architecture

## Overview

The Astro platform uses a **two-backend architecture** in production:

```
Frontend (Mini App, Dashboard, Superadmin)
        │
        ▼
   SaaS API (:8000)
        │
        ▼
   Astro API (:8100)
```

**Important:** The frontend must call **SaaS API only**. Astro API is an internal service for astrology calculations and structured report generation. The frontend must never call Astro API directly in production.

## Service responsibilities

### SaaS API (`services/saas-api`)

Main platform backend for:

- Tenant configuration (draft/publish) — **BE-02**
- Accounts, sessions, RBAC — **BE-02**
- Dashboard and superadmin APIs — **BE-02**
- Public tenant config/products — **BE-02**
- Telegram runtime integration — **BE-03**
- End-user sessions, birth profiles, report history — **BE-03**
- Report orchestration (SaaS → Astro) — **BE-03**
- Analytics ingestion — **BE-04**
- Media management — **BE-04**
- Superadmin operational health — **BE-04**

**BE-02** adds PostgreSQL, Alembic migrations, httpOnly cookie auth, tenant CRUD, draft/publish config APIs, seed data, and audit logging.

### Astro API (`services/astro-api`)

Narrow, specialized backend for:

- Astrology calculations (future)
- Structured report generation
- AI/templated content pipelines (future)

Unchanged in BE-02 — health/version plus mock `POST /v1/reports/free` stub.

## Shared conventions (`services/backend-common`)

Both services share:

- API response envelope (`ok`, `data`, `error`, `meta`)
- Error codes aligned with `@astro/api-contracts`
- FastAPI exception handlers (with HTTP status on `AppError`)
- CORS, logging, and settings helpers

## Request flow (BE-03)

1. Mini App calls SaaS API: `POST /api/telegram/validate-init-data`
2. SaaS API validates Telegram initData, creates end-user session
3. Mini App calls SaaS API: `POST /api/reports/free`
4. SaaS API validates tenant/user, persists report lifecycle
5. SaaS API calls Astro API: `POST /v1/reports/free`
6. Astro API returns structured `Report` JSON
7. SaaS API validates report shape, saves history, returns envelope to frontend

## BE-03 status

| Area | Status |
|------|--------|
| Telegram initData validation | Implemented |
| End-user httpOnly sessions | Implemented |
| Birth profiles | Implemented |
| Reports pipeline | Implemented |
| SaaS → Astro orchestration | Implemented |
| Mini App remote mode | Supported (optional) |
| Payments | Not implemented |
| Media uploads | Implemented (BE-04, local storage) |
| Analytics persistence | Implemented (BE-04) |
| Superadmin health / audit read | Implemented (BE-04) |

## BE-02 status

| Area | Status |
|------|--------|
| PostgreSQL + Alembic | Implemented |
| Auth (httpOnly cookie session) | Implemented |
| Tenant/config persistence | Implemented |
| Dashboard/superadmin endpoints | Implemented |
| Public tenant endpoints | Implemented |
| Telegram runtime | Implemented (BE-03) |
| Reports pipeline | Implemented (BE-03) |
| Payments / media | Not implemented |
| Frontend default mode | Mock (unchanged) |
| Dashboard/superadmin remote mode | Supported with login |
| Mini App remote mode | Supported with Telegram/dev auth (BE-03) |
| Public runtime active-only | Enforced (BE-03-FIX) |
| Superadmin platform role gate | Remote mode (BE-03-FIX) |

## Local development

```bash
pnpm db:migrate:saas   # Alembic migrations
pnpm db:seed:saas      # Bootstrap accounts + demo tenants
pnpm dev:saas-api      # http://localhost:8000
pnpm dev:astro-api     # http://localhost:8100
pnpm dev:backend       # both services
pnpm test:backend      # pytest
```

OpenAPI docs:

- SaaS API: http://localhost:8000/docs
- Astro API: http://localhost:8100/docs

## Next package

**BE-03 — Telegram Runtime + Reports Pipeline** — initData validation, end-user sessions, report orchestration (SaaS → Astro).

See [BE02_SAAS_PERSISTENCE_AUTH.md](./BE02_SAAS_PERSISTENCE_AUTH.md) for BE-02 details.
