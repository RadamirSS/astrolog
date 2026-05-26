# Closed Pilot Runbook

Операционное руководство для **closed pilot** с 1–3 creators (Package 14D docs sync).

---

## Матрица доступа

| Действие | platform_admin | creator (partner-scoped) | viewer |
|----------|----------------|--------------------------|--------|
| List/view orders | all tenant | own partner only | own partner read-only |
| Approve mock payment / unlock / revoke entitlement | yes | **denied** | **denied** |
| Sync payment/report, retry report | yes | **denied** | **denied** |
| Finance reads (payments, commissions, payouts, balance) | all or filtered | own partner only | own partner read-only |
| Ledger, revenue, product economics | yes | **denied** | **denied** |
| Release/hold commission, payouts, adjustments | yes | **denied** | **denied** |

Creators без `partner_id` — denied finance и order ops.

---

## Partner / commission source of truth

- Partner records — **PostgreSQL** (`partners` table)
- Commission rate: `Partner.default_commission_rate` или `PLATFORM_DEFAULT_COMMISSION_RATE` (default 0.5)
- Publish tenant config ensures partner from `miniApp.partnerId`
- Finance routes **не** используют static seed

Public resolver:
- Primary: `GET /api/public/partners/{slug}`
- Alias: `GET /api/public/miniapps/{slug}`

---

## Политика manual payout

- Pilot payouts — **только manual**
- Payout method API — только `maskedDetails`
- См. [CLOSED_PILOT_PAYOUT_RUNBOOK.md](./CLOSED_PILOT_PAYOUT_RUNBOOK.md)

---

## Целевая product model

1. Creator настраивает mini app в dashboard
2. Users visit `/b/{slug}` topic links
3. Platform receives payments via Payment API
4. Platform pays creators **manually** via payout workflow

Active topics: `money`, `relationships`, `personality`  
Catalog: `packages/tenant-config/src/product-catalog.ts`

---

## Режимы pilot

| Mode | APP_ENV | PAYMENT_API_MODE | ASTRO_API_MODE | Use case |
|------|---------|------------------|----------------|----------|
| Internal demo | `development` | `mock` | `mock` | Local UX demo |
| Closed mock-payment pilot | `staging` + `ALLOW_STAGING_MOCKS=true` OR `development` | `mock` | `mock` or `remote` | Full funnel QA |
| Closed real-payment pilot | `production` or `staging` | `remote` | `remote` | Real payment + reports |

Production **forbids** `PAYMENT_API_MODE=mock` and `ASTRO_API_MODE=mock`.

---

## Что реализовано

- User funnel (onboarding → free report → paywall → checkout → My Reports)
- Approved 7-product line
- Dashboard ops (orders, entitlements, premium requests, partners)
- Persisted orders, entitlements, premium requests, paid reports (PostgreSQL)
- Server-side product validation at checkout
- Partner slug resolution via public API

## Что external

- Astro calculations — Astro API (remote) or mock
- Payment processing — Payment API (remote) or mock with admin approval

---

## Required environment variables

| Variable | Production | Staging | Development |
|----------|------------|---------|-------------|
| `APP_ENV` | `production` | `staging` | `development` |
| `DATABASE_URL` | required | required | optional |
| `PAYMENT_API_MODE` | `remote` | `remote` or `mock`* | `mock` |
| `PAYMENT_API_BASE_URL` | required if remote | required if remote | — |
| `PAYMENT_API_TOKEN` | **required** if remote | recommended | — |
| `ASTRO_API_MODE` | `remote` | `remote` or `mock`* | `mock` |
| `ASTRO_API_BASE_URL` | required if remote | required if remote | `http://localhost:8100` |
| `ASTRO_API_TOKEN` | **required** if remote | recommended | — |
| `ALLOW_STAGING_MOCKS` | `false` | `true` only if mock | — |
| `MINIAPP_PUBLIC_BASE_URL` | miniapp URL | staging URL | `http://localhost:3000` |
| `TELEGRAM_BOT_TOKEN` | required | recommended | optional |
| `TELEGRAM_BOT_SETUP_MODE` | `remote` | `remote` or `mock` | `mock` |
| `TELEGRAM_TOKEN_ENCRYPTION_KEY` | required if remote setup | recommended | optional |
| `ALLOW_DEV_TELEGRAM_AUTH` | `false` | `false` | `true` locally |

\* Staging mock requires `ALLOW_STAGING_MOCKS=true`.

---

## Preflight checklist

```bash
bash scripts/pilot-preflight.sh
bash scripts/pilot-preflight.sh --quick
pnpm docs:check
```

### Infrastructure
- [ ] `pnpm db:migrate:saas` applied
- [ ] SaaS API starts without validation errors
- [ ] CORS origins — explicit frontend URLs

### Catalog & tenant
- [ ] Pilot tenant published
- [ ] Approved product line only
- [ ] Partner resolves via `/api/public/partners/{slug}`

### Flows
- [ ] Free report flow
- [ ] Paid checkout: client sends `productId` only
- [ ] Payment return alone does **not** mark paid
- [ ] Mock: Approve mock payment → entitlement → report
- [ ] Premium request → dashboard queue
- [ ] Data persists after API restart

---

## Creator setup

1. Platform admin creates tenant + creator account with `partner_id`
2. Creator logs in → brand, design, content
3. Enables approved products (prices read-only)
4. Sets `miniApp.publicSlug`, enables surfaces, connects Telegram if needed
5. Publishes → shares `/b/{slug}`, topic links

---

## User flow

1. Landing → topic preselect
2. Birth form → free report
3. Paywall → product detail
4. Checkout: `productId` + `productType` only
5. Payment return → `confirm-return` (not auto-unlock)
6. Paid entitlement → report → My Reports
7. Premium → manual request queue

---

## Finance operations (platform admin)

| Step | Action |
|------|--------|
| Verify payment | Finance → Payments |
| Review commission | Finance → Commissions |
| Release commission | Commissions → **Release** |
| Verify balance | `GET .../ops/balances/{partnerId}/verify` |
| Create payout | Payouts → draft |
| Approve payout | Payouts → **Approve** |
| Mark paid | Payouts → **Mark paid** (after external transfer) |
| Refund | `POST .../ops/orders/{orderId}/mark-refunded` |

---

## Start services

```bash
bash scripts/setup-backend-venv.sh
pnpm db:migrate:saas
pnpm pilot:bootstrap
pnpm dev:backend   # terminal 1
pnpm dev           # terminal 2
```

---

## Troubleshooting

| Symptom | Check |
|---------|-------|
| Production startup payment error | `PAYMENT_API_MODE=remote`, `PAYMENT_API_BASE_URL` |
| Staging mock fails | `ALLOW_STAGING_MOCKS=true` |
| Partner link 404 | Published config, mini app published |
| Telegram auth 401 | `TELEGRAM_BOT_TOKEN`, dev auth settings |

См. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Related docs

- [COMMERCE_LEDGER.md](./COMMERCE_LEDGER.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
