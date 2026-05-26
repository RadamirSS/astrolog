> **Исторический / English doc.** Актуальная версия: [docs/ru/QA_CHECKLIST.md](./ru/QA_CHECKLIST.md)

---

# Pilot QA Checklist

Use before inviting closed-pilot bloggers. Complements [PILOT_READINESS_CHECKLIST.md](./PILOT_READINESS_CHECKLIST.md) (Package 6 demo polish) with BE-05 operational coverage.

## Frontend

- [ ] Mini App loads in EN
- [ ] Mini App loads in RU
- [ ] Dashboard loads in EN
- [ ] Dashboard loads in RU
- [ ] Superadmin loads in EN
- [ ] Superadmin loads in RU
- [ ] Mobile viewport acceptable (Mini App + Dashboard)
- [ ] Published preview matches published config
- [ ] Draft preview shows unpublished changes
- [ ] Remote mode works (`NEXT_PUBLIC_API_MODE=remote`)
- [ ] Mock mode still works for demos (`NEXT_PUBLIC_API_MODE=mock`)

## Backend

- [ ] `GET /health` — SaaS API
- [ ] `GET /ready` — SaaS API (DB reachable)
- [ ] `GET /health` — Astro API
- [ ] `GET /ready` — Astro API
- [ ] Auth login/logout
- [ ] Tenant isolation (blogger cannot access other tenant data)
- [ ] Telegram initData validation (with real bot token)
- [ ] Dev Telegram fallback works locally only (`ALLOW_DEV_TELEGRAM_AUTH=true`, `APP_ENV=development`)
- [ ] Report pipeline (SaaS → Astro stub)
- [ ] Analytics event ingestion
- [ ] Dashboard metrics endpoint
- [ ] Media upload/list/delete
- [ ] Superadmin tenant health endpoint
- [ ] Audit logs read endpoint

## Security

- [ ] Superadmin requires platform role
- [ ] `ALLOW_DEV_TELEGRAM_AUTH=false` in staging/production templates
- [ ] Production startup rejects dev Telegram auth
- [ ] `SAAS_COOKIE_SECURE=true` documented for staging/production
- [ ] No secrets committed to repository
- [ ] `CORS_ORIGINS` restricted to known frontends
- [ ] Astro API not used as frontend runtime dependency
- [ ] Session secret not default in staging/production

## End-to-end pilot flow

- [ ] Create or select pilot tenant
- [ ] Blogger login to dashboard
- [ ] Edit brand/config (copy, colors, modules)
- [ ] Upload avatar/logo/cover (remote mode)
- [ ] Publish config
- [ ] Open Mini App for tenant slug
- [ ] Submit birth profile
- [ ] Receive free report (stub)
- [ ] Click product CTA
- [ ] Analytics visible in dashboard metrics
- [ ] Superadmin health check shows healthy signals

## Automated checks

```bash
pnpm test:backend
pnpm typecheck
pnpm build
pnpm lint
pnpm smoke:local    # with backend running
```

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| Engineering | | | |
| Pilot lead | | | |

## Related

- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
