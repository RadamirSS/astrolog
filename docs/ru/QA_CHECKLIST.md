# QA Checklist — перед closed pilot

Полный чеклист перед приглашением creators. Дополняет operational coverage из [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md).

---

## Frontend

- [ ] Mini App loads EN + RU
- [ ] Dashboard loads EN + RU
- [ ] Superadmin loads EN + RU
- [ ] Mobile viewport (Mini App + Dashboard)
- [ ] Published preview matches published config
- [ ] Draft preview shows unpublished changes
- [ ] Remote mode works (`NEXT_PUBLIC_API_MODE=remote`)
- [ ] Mock mode works for demos
- [ ] Multi-surface: website / mobile_web / telegram (if enabled)
- [ ] Public surface loads via `/api/public/surfaces/{type}/{slug}`
- [ ] Payment return pages call `confirm-return`

---

## Backend

- [ ] `GET /health`, `/ready` — SaaS API
- [ ] `GET /health`, `/ready` — Astro API
- [ ] Auth login/logout (dashboard + superadmin)
- [ ] Tenant isolation
- [ ] Telegram initData validation (real bot) OR dev bypass locally only
- [ ] Free report pipeline (SaaS → Astro)
- [ ] Checkout: server-side catalog price
- [ ] Entitlements gate report access
- [ ] Premium request persist + dashboard queue
- [ ] Finance ops: orders, commissions, balances, ledger
- [ ] Analytics, media, audit logs

---

## Integrations

- [ ] `ASTRO_API_MODE` correct for environment
- [ ] `PAYMENT_API_MODE` correct for environment
- [ ] Production rejects mock modes
- [ ] Staging mock requires `ALLOW_STAGING_MOCKS=true`
- [ ] Telegram bot connect (if telegram surface)
- [ ] Payment return URLs resolve correctly

---

## Security

- [ ] Superadmin requires platform role
- [ ] `ALLOW_DEV_TELEGRAM_AUTH=false` in staging/prod templates
- [ ] `SAAS_COOKIE_SECURE=true` in staging/prod
- [ ] No secrets in repository
- [ ] `CORS_ORIGINS` restricted
- [ ] Astro/Payment tokens not in frontend packages
- [ ] Checkout request has no `amount` field in contract

---

## End-to-end pilot flow

- [ ] Create/select pilot tenant
- [ ] Creator login → Launch Studio
- [ ] Configure brand, products, surfaces
- [ ] Connect Telegram bot (if needed)
- [ ] Publish mini-app
- [ ] Open public link `/b/{slug}`
- [ ] Birth profile → free report (V2 schema)
- [ ] Product checkout → payment → confirm-return
- [ ] My Reports shows entitlement-gated report
- [ ] Premium request submit → dashboard triage
- [ ] Admin: commission release → payout workflow
- [ ] Data persists after API restart

---

## Automated checks

```bash
pnpm test:backend
pnpm typecheck
pnpm build
pnpm lint
pnpm pilot:preflight
pnpm docs:check
pnpm smoke:local    # backend running
```

---

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Pilot lead | | | |
