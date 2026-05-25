# Astro Platform — White-Label Astrology Mini App

Frontend platform for a white-label astrology Telegram Mini App SaaS. One codebase, multiple tenant configs, different branded Mini App experiences.

**Package 7** delivers i18n and Russian localization — shared `@astro/i18n` layer, EN/RU UI across all apps, localized pilot tenants and mock reports, locale switcher, and i18n documentation.

**BE-03** adds Telegram initData validation, end-user sessions, birth profiles, report persistence, SaaS→Astro orchestration, Mini App remote mode, and backend tests.

**BE-05** adds deployment configuration, environment templates, Docker compose stack, production settings validation, readiness endpoints, pilot bootstrap/smoke scripts, and closed-pilot operational documentation.

**BE-04** adds analytics event ingestion, dashboard metrics, tenant-scoped media uploads (local storage), superadmin pilot health cards, audit log read API, and operational integration statuses.

**BE-02** adds SaaS API persistence — PostgreSQL, Alembic migrations, session auth, tenant/config CRUD, draft/publish workflow, seed data, dashboard/superadmin remote mode with login, and backend tests.

**BE-01** adds dual backend foundation — SaaS API and Astro API FastAPI skeletons, shared response envelope, Astro report stub, dev scripts, and backend documentation.

**Package 6** delivered pilot polish and demo readiness — premium UI across apps, realistic demo tenants, typed analytics instrumentation, and demo/handoff documentation.

**Docs:** [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) · [docs/CLOSED_PILOT_RUNBOOK.md](./docs/CLOSED_PILOT_RUNBOOK.md) · [docs/PILOT_QA_CHECKLIST.md](./docs/PILOT_QA_CHECKLIST.md) · [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) · [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) · [docs/PILOT_READINESS_CHECKLIST.md](./docs/PILOT_READINESS_CHECKLIST.md) · [docs/I18N_GUIDE.md](./docs/I18N_GUIDE.md) · [docs/BACKEND_ARCHITECTURE.md](./docs/BACKEND_ARCHITECTURE.md) · [docs/BE02_SAAS_PERSISTENCE_AUTH.md](./docs/BE02_SAAS_PERSISTENCE_AUTH.md) · [docs/BE03_TELEGRAM_REPORTS_PIPELINE.md](./docs/BE03_TELEGRAM_REPORTS_PIPELINE.md) · [docs/BE04_ANALYTICS_MEDIA_ADMIN_HARDENING.md](./docs/BE04_ANALYTICS_MEDIA_ADMIN_HARDENING.md)

## Apps

| App | Port | Purpose |
|-----|------|---------|
| `apps/miniapp` | 3000 | End-user Telegram Mini App runtime |
| `apps/dashboard` | 3001 | Blogger dashboard for customizing branded Mini App |
| `apps/superadmin` | 3002 | Internal platform admin panel |

## Backend services (BE-01 / BE-02)

| Service | Port | Purpose |
|---------|------|---------|
| `services/saas-api` | 8000 | Platform API — auth, tenants, config, Telegram runtime (BE-02/BE-03) |
| `services/astro-api` | 8100 | Internal astrology/report generation API |

Production flow: **Frontend → SaaS API → Astro API**. Frontend must not call Astro API directly.

Requires Python 3.11+ and PostgreSQL for SaaS API persistence.

```bash
# First-time setup (creates services/.venv and installs deps)
bash scripts/setup-backend-venv.sh

# Database (PostgreSQL required)
pnpm db:migrate:saas
pnpm db:seed:saas

# Run individually
pnpm dev:saas-api     # http://localhost:8000/docs
pnpm dev:astro-api    # http://localhost:8100/docs
pnpm dev:backend      # both services

# Backend tests (SQLite in-memory for SaaS API tests)
pnpm test:backend
```

Seed accounts (defaults): `admin@astro.local` / `admin123!` (platform owner), `blogger@astro.local` / `blogger123!` (blogger owner).

Remote mode for dashboard/superadmin:

```bash
# .env.local
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

Remote mode for Mini App (optional, BE-03):

```bash
# .env.local
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# SaaS API (.env) — dev Telegram bypass when not in Telegram
TELEGRAM_BOT_TOKEN=
ALLOW_DEV_TELEGRAM_AUTH=true
ASTRO_API_BASE_URL=http://localhost:8100
ASTRO_API_TIMEOUT_SECONDS=20
```

Start Astro API alongside SaaS API for report generation: `pnpm dev:backend`.

Then login at `/login` in dashboard (3001) or superadmin (3002).

Health checks:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
curl http://localhost:8100/health
curl http://localhost:8100/ready
curl http://localhost:8100/version
```

## Deployment & pilot (BE-05)

Closed-pilot deployment docs:

- [docs/DEPLOYMENT_GUIDE.md](./docs/DEPLOYMENT_GUIDE.md) — Path A (managed) and Path B (Docker/VPS)
- [docs/CLOSED_PILOT_RUNBOOK.md](./docs/CLOSED_PILOT_RUNBOOK.md) — day-to-day pilot operations
- [docs/PILOT_QA_CHECKLIST.md](./docs/PILOT_QA_CHECKLIST.md) — pre-pilot QA sign-off
- [docs/ENVIRONMENT_VARIABLES.md](./docs/ENVIRONMENT_VARIABLES.md) — env reference

```bash
# Pilot bootstrap (migrate + seed + URLs)
pnpm pilot:bootstrap

# Smoke test (backend must be running)
pnpm smoke:local

# Docker local backend stack
docker compose -f docker-compose.dev.yml up --build

# BE-05 milestone archive
pnpm archive:be05
```

Env templates: `.env.example` (dev/mock default), `.env.staging.example`, `.env.production.example`.

Backend docs: [docs/BACKEND_ARCHITECTURE.md](./docs/BACKEND_ARCHITECTURE.md) · [docs/SAAS_API_CONTRACT.md](./docs/SAAS_API_CONTRACT.md) · [docs/ASTRO_API_CONTRACT.md](./docs/ASTRO_API_CONTRACT.md)

## Packages

| Package | Purpose |
|---------|---------|
| `@astro/i18n` | Shared i18n layer: dictionaries, locale resolution, provider, switcher |
| `@astro/tenant-config` | Single source of truth for tenant configuration types and validation |
| `@astro/api-contracts` | HTTP wire format: envelope, error codes, DTOs, Zod schemas, endpoint paths |
| `@astro/theme-engine` | Theme presets and resolver (CSS variables, styling primitives) |
| `@astro/mock-api` | Typed mock data and mock API handlers |
| `@astro/api-client` | Frontend API abstraction (mock / remote adapters) |
| `@astro/analytics` | Typed analytics event catalog and mock analytics client |
| `@astro/ui` | Shared generic UI components |
| `@astro/miniapp-renderer` | Mini App screens, navigation, and shell |
| `@astro/report-renderer` | Structured report display components |

Additional packages (`telegram`) extend the foundation for later packages.

## Install

```bash
pnpm install
```

Copy environment variables:

```bash
cp .env.example .env.local
```

## Run (development)

Run all apps via Turborepo:

```bash
pnpm dev
```

Or run individual apps:

```bash
pnpm --filter @astro/miniapp dev
pnpm --filter @astro/dashboard dev
pnpm --filter @astro/superadmin dev
```

## Build & typecheck

```bash
pnpm typecheck
pnpm build
pnpm lint
pnpm clean   # remove build artifacts
```

## Mock mode

Set `NEXT_PUBLIC_API_MODE=mock` (default) to use typed mock data from `@astro/mock-api` via `@astro/api-client`. No real backend required.

Set `NEXT_PUBLIC_API_MODE=remote` to call `NEXT_PUBLIC_API_BASE_URL` using the standard API envelope (see [docs/API_CONTRACTS.md](./docs/API_CONTRACTS.md)). If the base URL is empty, the client returns `REMOTE_API_NOT_CONFIGURED`.

Default tenant for miniapp home preview:

```
NEXT_PUBLIC_DEFAULT_TENANT_SLUG=mystic-dark
```

Default tenant for dashboard (when no `tenantId` query param or cookie):

```
NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID=tenant_mystic
```

Mock tenants include: `mystic-dark`, `soft-feminine`, `luxury-gold`, `luna-astro`, `cosmic-guide`.

Default UI locale:

```
NEXT_PUBLIC_DEFAULT_LOCALE=en
```

## i18n & Russian demo (Package 7)

Supported locales: **English** (default) and **Russian**.

- Locale switcher in Mini App (`/tenants`, profile), Dashboard topbar, Superadmin topbar
- Query param: `?lang=ru` · Persists in `localStorage` (`astro_locale`)

| Demo | Russian URL |
|------|-------------|
| Launcher | http://localhost:3000/tenants?lang=ru |
| Mystic Dark | http://localhost:3000/mystic-dark?lang=ru |
| Soft Feminine | http://localhost:3000/soft-feminine?lang=ru |
| Luxury Gold | http://localhost:3000/luxury-gold?lang=ru |
| Dashboard | http://localhost:3001/overview?tenantId=tenant_mystic&lang=ru |

Guide: [docs/I18N_GUIDE.md](./docs/I18N_GUIDE.md)

## API client architecture (Package 5)

```
Apps → @astro/api-client (facade)
         ├── mock adapter → @astro/mock-api
         └── remote adapter → fetch + @astro/api-contracts (envelope, validation)
```

- **Mock mode** (default): in-memory fixtures, no backend.
- **Remote mode**: expects `{ ok, data }` envelope from backend; validates key responses.
- Contract types and endpoint paths: `@astro/api-contracts`.
- Domain models remain in `@astro/tenant-config` (no duplication).

See [docs/API_CONTRACTS.md](./docs/API_CONTRACTS.md) and [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md).

## Mini App routes

Tenant-scoped routes (primary):

| Route | Screen |
|-------|--------|
| `/{tenantSlug}` | Home |
| `/{tenantSlug}/onboarding` | Birth profile onboarding |
| `/{tenantSlug}/report/loading` | Premium generation loading |
| `/{tenantSlug}/report/free` | Free structured report |
| `/{tenantSlug}/products` | Products & services list |
| `/{tenantSlug}/products/[id]` | Product detail |
| `/{tenantSlug}/profile` | User profile |

Root shortcuts redirect to `NEXT_PUBLIC_DEFAULT_TENANT_SLUG` (default `mystic-dark`):

`/`, `/onboarding`, `/report/free`, `/products`, `/products/[id]`, `/profile`

Dev tenant list (demo launcher): `/tenants` — see [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md)

Draft preview in mini app: `/{tenantSlug}?preview=draft`

## Dashboard routes (Package 3 + 4)

| Route | Purpose |
|-------|---------|
| `/overview` | Setup progress and quick links |
| `/setup`, `/brand`, `/design`, `/content`, `/products` | Builder editors |
| `/preview` | Draft and published embedded preview (7 screens) |
| `/publish` | Publish flow with checklist and confirmations |
| `/settings` | Module toggles (draft only) and integration status |

## Superadmin routes (Package 4)

| Route | Purpose |
|-------|---------|
| `/` | Redirects to `/tenants` |
| `/tenants` | Tenant list, status management, create tenant |
| `/tenants/[tenantId]` | Tenant detail, config summary, integration placeholders |

## Preview system (Package 4)

Dashboard embedded preview reuses `MiniAppRoot` from `@astro/miniapp-renderer` — not a separate fake UI.

Supported screens: Home, Onboarding, Loading, Free Report, Products, Product Detail, Profile.

- **Draft Preview** — uses current draft config
- **Published Preview** — uses last published config (when available)
- External mini app links: `?preview=draft` for draft, default URL for published

## Draft / publish model (Package 4)

Mock API stores `{ draft, published }` bundles per tenant via `@astro/tenant-config`.

| API method | Purpose |
|------------|---------|
| `getDraftConfig(tenantId)` | Load working draft |
| `saveDraftConfig(tenantId, config)` | Save draft |
| `getPublishedConfig(tenantId)` | Load published snapshot (or null) |
| `getConfigStatus(tenantId)` | Unpublished changes, timestamps, changed areas |
| `publishConfig(tenantId)` | Promote draft → published |
| `discardDraftConfig(tenantId)` | Revert draft to published |
| `restoreDraftFromPublished(tenantId)` | Same as discard — restore draft from published |

Destructive actions (publish, discard, restore) require confirmation in the dashboard UI.

## Integration status placeholders

Future modules show status cards only (`not_configured`, `coming_later`, `mock_only`, `active`, `error`):

- Telegram — `not_configured`
- Payments — `coming_later` (disabled, not implemented)
- Analytics — `not_configured`
- Backend API — `mock_only`
- Report generation — `mock_only`

## Lint

Each Next.js app uses `eslint-config-next` with a minimal `.eslintrc.json` (`next/core-web-vitals`). `pnpm lint` runs non-interactively via Turborepo.

## Archive hygiene

Before creating a release archive, remove build artifacts and junk files:

```bash
pnpm clean
find . -name '._*' -not -path './node_modules/*'
find . -name '*.tsbuildinfo' -not -path './node_modules/*'
```

Both commands should return no files.

Clean archive command:

```bash
pnpm archive
```

Default archive name: `astrology-platform-be-01-dual-backend-foundation.tar.gz`

Verify the archive contains no junk:

```bash
tar -tzf archives/astrology-platform-be-01-dual-backend-foundation.tar.gz | grep -E '(^|/)\._|tsbuildinfo|node_modules|\.next|dist|\.turbo|\.venv|__pycache__|\.pytest_cache|\.pyc|(^|/)archives(/|$)'
tar -tzf archives/astrology-platform-be-01-dual-backend-foundation.tar.gz >/tmp/be01-archive-list-check.txt
```

Both commands must return nothing (no matches, no `LIBARCHIVE.xattr` warnings).

## Current package scope

### Package 1 — Foundation
- Monorepo structure with three apps and shared packages
- TenantConfig schema, default config, and mock tenant data
- Theme presets and theme resolver
- Mock API client with mock/remote mode abstraction
- Basic shared UI components and dashboard/superadmin apps

### Package 2 — Mini App Runtime
- Tenant-driven home with featured products, FAQ, consultation CTA
- Multi-step birth profile onboarding with topic selection
- Premium loading/generation screen with rotating messages
- Structured free report via `@astro/report-renderer`
- Products list and product detail with placeholder CTAs (no payments)
- Profile with birth data, report history placeholder, local mock persistence
- URL routing with root shortcuts and `@astro/api-client` integration

### Package 3 — Dashboard Builder
- Setup wizard, brand/design/content/products editors
- Compact preview (draft), local draft editing with auto-save
- Module toggles and placeholder integration sections

### Package 4 — Preview + Draft/Publish + Superadmin
- Full 7-screen preview with draft/published source toggle
- Formal draft vs published config in mock/API layer
- Publish page with status, checklist, changed areas, confirmations
- Discard/restore safeguards with confirmation dialogs
- Superadmin tenant list, detail, status management, quick actions
- Integration status placeholders (no real payments or backend)

### Package 5 — Backend Contract Integration Layer
- `@astro/api-contracts`: envelope, error codes, DTOs, Zod validation helpers
- Mock and remote adapters with matching `ApiAdapter` interface
- Remote mode fails gracefully when `NEXT_PUBLIC_API_BASE_URL` is unset
- Runtime validation for TenantConfig, Report, Product, ConfigStatus, DashboardSummary
- Typed analytics event catalog and `MockAnalyticsClient`
- [docs/API_CONTRACTS.md](./docs/API_CONTRACTS.md) and [docs/BACKEND_HANDOFF.md](./docs/BACKEND_HANDOFF.md)

### Package 6 — Pilot Polish + Demo Readiness
- Premium UI polish: mini app screens, report renderer, dashboard copy, superadmin layout
- Presentation-ready demo tenants (Mystic Dark, Soft Feminine, Luxury Gold)
- `SafeImage`, `LoadingState`, `StatusBadge` shared components
- Typed analytics instrumentation across all apps (mock-only)
- Demo launcher at `/tenants`
- [docs/DEMO_GUIDE.md](./docs/DEMO_GUIDE.md) and [docs/PILOT_READINESS_CHECKLIST.md](./docs/PILOT_READINESS_CHECKLIST.md)

### Package 7 — i18n + Russian Localization
- `@astro/i18n`: dictionaries, locale resolution, provider, switcher
- EN/RU UI across Mini App, Dashboard, Superadmin
- Optional `TenantConfig.locales.ru` overlays + `localizeTenantConfig()`
- Russian pilot tenant content and mock reports (mystic-dark, soft-feminine, luxury-gold)
- [docs/I18N_GUIDE.md](./docs/I18N_GUIDE.md) and [docs/I18N_AUDIT.md](./docs/I18N_AUDIT.md)

### BE-01 — Dual Backend Foundation
- `services/saas-api` and `services/astro-api` FastAPI skeletons
- `services/backend-common` shared envelope, errors, logging, CORS helpers
- Health/version endpoints; Astro `POST /v1/reports/free` mock report stub (EN/RU)
- Dev scripts: `pnpm dev:saas-api`, `pnpm dev:astro-api`, `pnpm dev:backend`, `pnpm test:backend`
- [docs/BACKEND_ARCHITECTURE.md](./docs/BACKEND_ARCHITECTURE.md), [docs/SAAS_API_CONTRACT.md](./docs/SAAS_API_CONTRACT.md), [docs/ASTRO_API_CONTRACT.md](./docs/ASTRO_API_CONTRACT.md)

## Current limitations

- Frontend mock mode remains default — backend skeletons exist but frontend is not switched to remote mode
- SaaS API has no tenant/auth/database endpoints yet
- Astro API report stub only — no real calculations or AI
- Product CTAs open Telegram/external links or show “request” placeholders — no checkout
- Analytics events stored in mock memory — not connected to a real provider
- Media inputs are URL-based — no upload/crop UI
- Dashboard activity stats are sample data

## Next step

**BE-02 — SaaS Persistence + Auth + Tenant Config API** — PostgreSQL, authentication, and tenant config endpoints on SaaS API.

Recommended audit after BE-01: **Audit BE-01 — Backend Foundation Audit**.
