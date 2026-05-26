> **Исторический документ / Historical doc.** Актуальная версия: см. [docs/legacy/README.md](../legacy/README.md) для карты замены.

---

# BE-02 — SaaS Persistence + Auth + Tenant Config API

## Overview

BE-02 adds PostgreSQL persistence, session-based authentication, tenant management, and draft/published tenant config APIs to the SaaS API.

## Database schema

| Table | Purpose |
|-------|---------|
| `accounts` | Platform and blogger accounts (email, password hash, role, status) |
| `tenants` | Tenant records (slug, status) |
| `tenant_members` | Account ↔ tenant membership with role (`owner`, `manager`, `viewer`) |
| `tenant_configs` | Draft and published config JSON per tenant |
| `integration_statuses` | Per-tenant module integration status |
| `audit_logs` | Login, config, and tenant lifecycle audit trail |

## Auth model

- Login: `POST /auth/login` with email + password
- Session: signed JWT in **httpOnly cookie** (`SAAS_SESSION_SECRET`, `SAAS_COOKIE_NAME`)
- No tokens in localStorage
- Bootstrap-only accounts (no public registration)

### Roles

| Role | Access |
|------|--------|
| `platform_owner` | All tenants, create tenant, change tenant status |
| `blogger_owner` | Assigned tenants only (via `tenant_members`) |

Reserved for future: `platform_admin`, `blogger_manager`, `viewer`.

## Seed accounts (local defaults)

| Email | Password | Role |
|-------|----------|------|
| `admin@astro.local` | `admin123!` | `platform_owner` |
| `blogger@astro.local` | `blogger123!` | `blogger_owner` |

Override via `SAAS_BOOTSTRAP_*` env vars.

## Demo tenants

| Slug | Tenant ID |
|------|-----------|
| `mystic-dark` | `tenant_mystic` |
| `soft-feminine` | `tenant_soft` |
| `luxury-gold` | `tenant_luxury` |

Each has draft + published config and default integration statuses.

## Tenant config flow

1. **Draft** — editable via `PUT /api/dashboard/tenants/{id}/config/draft`
2. **Publish** — copies draft → published with new version + `publishedAt`
3. **Discard / restore** — resets draft from published
4. **Config status** — returns `hasUnpublishedChanges`, `changedAreas`, versions, timestamps

Public mini-app reads **published config only** via `/api/tenant/{slug}/config`.

## Local setup

```bash
# PostgreSQL (example)
export DATABASE_URL=postgresql+psycopg://astro:astro@localhost:5432/astro_saas

pnpm db:migrate:saas
pnpm db:seed:saas
pnpm dev:saas-api
```

Login:

```bash
curl -c cookies.txt -X POST http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@astro.local","password":"admin123!"}'
curl -b cookies.txt http://localhost:8000/auth/me
```

## Remote frontend mode

Dashboard / Superadmin (not miniapp):

```bash
# .env.local
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Then open dashboard/superadmin — login pages appear when unauthenticated.

Mock mode remains default and unchanged.

## BE-02 limitations

- No Telegram runtime
- No reports pipeline / birth profile / analytics persistence
- No SaaS → Astro orchestration
- No media uploads or payments
- Dashboard stats are stub values (zeros + lastPublishedAt)
- Pragmatic Python config validation (not full Zod parity)

## Next: BE-03

Telegram Runtime + Reports Pipeline — initData validation, end-user sessions, report orchestration (SaaS → Astro).
