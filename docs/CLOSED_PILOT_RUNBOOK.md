# Closed Pilot Runbook

Operational guide for running a **closed pilot** with 1–3 creators after PR-ASTRO-PILOT-HARDENING-13.

---

## Target product model

1. Creator builds a mini app in the dashboard (brand, visual pack, approved products).
2. Users visit `/b/{slug}` topic links and complete the funnel.
3. Platform receives payments via external Payment API.
4. Platform pays creators **manually** via payout workflow (no automatic transfers).

Active MVP topics: `money`, `relationships`, `personality`.  
Active products: 7-type platform catalog in `packages/tenant-config/src/product-catalog.ts`.

---

## Pilot modes

| Mode | APP_ENV | PAYMENT_API_MODE | ASTRO_API_MODE | Use case |
|------|---------|------------------|----------------|----------|
| Internal demo | `development` | `mock` | `mock` | Local UX demo, no persistence requirement |
| Closed mock-payment pilot | `staging` + `ALLOW_STAGING_MOCKS=true` OR `development` | `mock` | `mock` or `remote` | Full funnel QA with admin mock payment approval |
| Closed real-payment pilot | `production` or `staging` | `remote` | `remote` | Real payment + real report backend |

Production **forbids** `PAYMENT_API_MODE=mock` and `ASTRO_API_MODE=mock` at startup.

---

## What is real in this package

- User funnel (onboarding → free report → paywall → checkout → My Reports)
- Approved 7-product line (see `packages/tenant-config/src/product-catalog.ts`)
- Dashboard ops (orders, entitlements, premium requests, partners)
- **Persisted** orders, entitlements, premium requests, paid report records (PostgreSQL)
- Server-side product validation at checkout (client cannot set price)
- Partner slug resolution via SaaS `GET /api/public/partners/{slug}`

## What is external

- **Astro calculations and report generation** — Astro API (remote) or mock stub
- **Payment processing** — Payment API (remote) or mock with admin approval

---

## Required environment variables

| Variable | Production | Staging | Development |
|----------|------------|---------|-------------|
| `APP_ENV` | `production` | `staging` | `development` |
| `DATABASE_URL` | required | required | optional (defaults to local PG) |
| `PAYMENT_API_MODE` | `remote` | `remote` or `mock`* | `mock` |
| `PAYMENT_API_BASE_URL` | required if remote | required if remote | — |
| `PAYMENT_API_TOKEN` | **required** if remote | recommended | — |
| `ASTRO_API_MODE` | `remote` | `remote` or `mock`* | `mock` |
| `ASTRO_API_BASE_URL` | required if remote | required if remote | `http://localhost:8100` |
| `ASTRO_API_TOKEN` | **required** if remote | recommended | — |
| `ALLOW_STAGING_MOCKS` | must be `false` | `true` only if using mock modes | — |
| `MINIAPP_PUBLIC_BASE_URL` / `NEXT_PUBLIC_APP_URL` | miniapp public URL | staging URL | `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | required | recommended | optional with dev auth |
| `ALLOW_DEV_TELEGRAM_AUTH` | `false` | `false` | `true` locally |

\* Staging mock modes require `ALLOW_STAGING_MOCKS=true`.

Templates: `.env.example`, `.env.staging.example`, `.env.production.example`

---

## Preflight checklist

Run automated checks:

```bash
bash scripts/pilot-preflight.sh
# or quick env/catalog only:
bash scripts/pilot-preflight.sh --quick
```

### Infrastructure
- [ ] `pnpm db:migrate:saas` applied (includes migration `005_finance_ledger`)
- [ ] SaaS API starts without production/integration validation errors
- [ ] `PAYMENT_API_MODE` and `ASTRO_API_MODE` logged correctly at startup
- [ ] CORS origins list explicit frontend URLs (no `*`)

### Catalog & tenant
- [ ] Pilot tenant published (`mystic-dark` or custom)
- [ ] Product catalog uses approved product line only (no legacy demo names)
- [ ] Active partner exists and resolves via `/api/public/partners/{slug}`

### Flows
- [ ] Free report: birth form → generate → view in My Reports
- [ ] Paid checkout: client sends `productId` only; order amount from server catalog
- [ ] Payment return alone does **not** mark paid
- [ ] Mock pilot: dashboard **Approve mock payment** → entitlement → report generation
- [ ] My Reports: no fake ready paid report without entitlement
- [ ] Premium request submit → persists → visible in dashboard queue
- [ ] Dashboard orders show persisted data after API restart

- [ ] Active mini app resolves via `/api/public/partners/{slug}` from **published** tenant config (not seed-only)

---

## Creator setup

1. Platform admin creates tenant + creator account with `partner_id`.
2. Creator logs into dashboard → configures brand, design, content.
3. Creator enables approved products (prices are platform-owned, read-only).
4. Creator sets `miniApp.publicSlug` and publishes.
5. Copy public links from publish page: `/b/{slug}`, `/b/{slug}/money`, etc.

---

## User flow

1. Landing → topic preselect (optional).
2. Birth form → free report.
3. Paywall → product detail.
4. Checkout sends `productId` + `productType` only (no client price).
5. Payment return does **not** grant access alone.
6. Paid entitlement → report generation → My Reports.
7. Premium consultation → manual request queue.

---

## Finance operations (platform admin)

| Step | Action |
|------|--------|
| Verify payment | Finance → Payments |
| Review commission | Finance → Commissions |
| Release commission | Commissions → **Release** (moves pending → available) |
| Verify balance | API: `GET .../ops/balances/{partnerId}/verify` |
| Create payout | Payouts → draft (amount ≤ available) |
| Approve payout | Payouts → **Approve** |
| Mark paid | Payouts → **Mark paid** (manual bank transfer done) |
| Refund | `POST .../ops/orders/{orderId}/mark-refunded` with reason |

Creators with `partner_id` see **only own** balances, commissions, and payout history. They cannot approve payouts or view platform margin/ledger.

---

## Premium operations

1. Dashboard → Premium Requests.
2. Assign/review manually; change status.
3. Attach PDF URL or external result when ready.

---

## What is external

- Astro calculations and report generation (Astro API)
- Payment provider integration (Payment API)
- PDF generation if delegated to external service

## What is not implemented

- Automatic payouts or payout provider SDKs
- KYC/KYB, tax reporting
- Automatic expert scheduling
- Internal ephemeris / house / aspect calculations in this repo

---

## Start services

### Local (recommended for QA)

```bash
bash scripts/setup-backend-venv.sh
pnpm db:migrate:saas
pnpm pilot:bootstrap
pnpm dev:backend   # terminal 1
pnpm dev           # terminal 2
```

### Staging

```bash
docker compose -f docker-compose.staging.yml --env-file .env.staging up -d --build
```

---

## Manual operations

| Task | How |
|------|-----|
| Check payment status | Dashboard → Order detail → **Check payment status** |
| Approve mock payment | Order detail → **Approve mock payment** (only when allowed by env) |
| View payments | Dashboard → **Finance → Payments** |
| View partner balances | Dashboard → **Finance → Balances** |
| Release commission | Dashboard → **Finance → Commissions** → **Release** |
| Create manual payout | Dashboard → **Finance → Payouts** → create draft → approve → mark paid |
| Audit ledger | Dashboard → **Finance → Ledger** |
| Mark refund | API: `POST .../ops/orders/{orderId}/mark-refunded` with reason |
| Check report status | Order detail → **Check report status** |
| Retry failed report | Order detail → **Retry report generation** |
| Flag for review | Order detail → **Mark needs review** |
| Revoke / unlock entitlement | Order detail → entitlement actions |
| Premium request triage | Dashboard → Premium Requests → update status |

---

## What not to promise

- No guaranteed predictions or outcomes
- No medical, legal, or financial advice
- No instant delivery if external Astro backend is queued
- No real calculations when `ASTRO_API_MODE=mock`
- No automatic payouts or real payment provider in this repo

---

## Smoke script

```bash
pnpm smoke:local
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Startup fails in production with payment error | `PAYMENT_API_MODE=remote` and `PAYMENT_API_BASE_URL` set |
| Startup fails in staging with mock | Set `ALLOW_STAGING_MOCKS=true` or switch to remote |
| Orders lost after restart | DB migration 004 not applied; verify PostgreSQL not in-memory |
| Partner link 404 | Published config missing or mini app not published |
| Checkout uses catalog price | Client amount/currency/productTitle are ignored by design |
| Telegram auth 401 | `TELEGRAM_BOT_TOKEN` or dev auth settings |

---

## Related docs

- [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md) — Report Schema V2
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- [INTEGRATIONS.md](./INTEGRATIONS.md)
