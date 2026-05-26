# Astro Platform — Creator Astrology Platform

Multi-surface astrology platform for creators (astrologers, bloggers): **Creator Dashboard / Launch Studio**, publishing to **Website**, **Mobile Web**, and **Telegram Mini App**, platform-owned checkout, entitlements, and finance (manual payouts during closed pilot).

**Documentation (RU-first):** [docs/ru/README.md](./docs/ru/README.md)

---

## Apps

| App | Port | Purpose |
|-----|------|---------|
| `apps/miniapp` | 3000 | Public end-user experience (all surfaces) |
| `apps/dashboard` | 3001 | Creator Dashboard — Launch Studio, ops, finance |
| `apps/superadmin` | 3002 | Platform admin — tenants, health, audit |

## Backend services

| Service | Port | Purpose |
|---------|------|---------|
| `services/saas-api` | 8000 | Platform API — auth, tenants, checkout, entitlements, finance |
| `services/astro-api` | 8100 | Internal report generation (SaaS API only) |
| Payment API | external | Payment provider integration (SaaS API only) |

**Data flow:** Frontend → SaaS API → Astro API / Payment API / Telegram Bot API. Frontend never calls Astro or Payment APIs directly.

Requires Python 3.11+ and PostgreSQL.

---

## Quick start

### Frontend only (mock mode, default)

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open miniapp http://localhost:3000, dashboard http://localhost:3001, superadmin http://localhost:3002.

### Full stack (remote mode)

```bash
bash scripts/setup-backend-venv.sh
pnpm db:migrate:saas && pnpm db:seed:saas

# .env.local
NEXT_PUBLIC_API_MODE=remote
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

pnpm dev:backend   # SaaS :8000 + Astro :8100
pnpm dev           # all frontend apps
```

Seed accounts: `admin@astro.local` / `admin123!`, `blogger@astro.local` / `blogger123!`

See [docs/ru/FRONTEND_BACKEND_CONNECTION.md](./docs/ru/FRONTEND_BACKEND_CONNECTION.md) for full setup.

---

## Product model (MVP)

**Funnel topics:** `money`, `relationships`, `personality`

| Product | productType | Price |
|---------|-------------|-------|
| Free mini-report | `free_report` | $0 |
| Денежный код | `low_ticket_money` | $29 |
| Код отношений | `low_ticket_relationships` | $29 |
| Личностный портрет | `low_ticket_personality` | $29 |
| Bundle: 3 темы | `bundle_all_topics` | $79 |
| Полный астрологический портрет | `main_natal_portrait` | $149 |
| Premium-разбор | `premium_consultation` | request mode |

Catalog source: `packages/tenant-config/src/product-catalog.ts`

---

## Packages

| Package | Purpose |
|---------|---------|
| `@astro/api-client` | Frontend API facade (mock / remote adapters) |
| `@astro/api-contracts` | HTTP envelope, DTOs, Zod schemas, endpoint paths |
| `@astro/tenant-config` | Tenant config types, product catalog |
| `@astro/mock-api` | In-process mock backend for development |
| `@astro/miniapp-renderer` | Public mini app screens and shell |
| `@astro/report-renderer` | Report Schema V2 display |

---

## Scripts

```bash
pnpm typecheck          # TypeScript check
pnpm test:backend       # Backend tests
pnpm pilot:preflight    # Pilot env + catalog checks
pnpm docs:check         # Documentation consistency checks
pnpm pilot:bootstrap    # Migrate + seed pilot data
pnpm smoke:local        # API smoke test (backend running)
```

Env templates: `.env.example`, `.env.staging.example`, `.env.production.example`

---

## Documentation

| Audience | Start here |
|----------|------------|
| All developers | [docs/ru/README.md](./docs/ru/README.md) |
| Frontend ↔ Backend | [docs/ru/FRONTEND_BACKEND_CONNECTION.md](./docs/ru/FRONTEND_BACKEND_CONNECTION.md) |
| API contracts | [docs/ru/API_CONTRACTS.md](./docs/ru/API_CONTRACTS.md) |
| Closed pilot ops | [docs/ru/CLOSED_PILOT_RUNBOOK.md](./docs/ru/CLOSED_PILOT_RUNBOOK.md) |
| Environment vars | [docs/ru/ENVIRONMENT_VARIABLES.md](./docs/ru/ENVIRONMENT_VARIABLES.md) |
| Legacy / history | [docs/legacy/README.md](./docs/legacy/README.md) |

---

## Platform boundaries

- Platform owns product catalog and prices — creators do not connect their own payment processors
- Platform receives payments; creators are paid **manually** during closed pilot
- Checkout pricing is resolved server-side — frontend must not send `amount`, `currency`, or `price`
- Entitlement access is server-side — payment return URL alone does not unlock content
- Telegram bot tokens and API tokens (`ASTRO_API_TOKEN`, `PAYMENT_API_TOKEN`) are server-only secrets
