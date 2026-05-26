# Troubleshooting — типичные ошибки

---

## Frontend / API client

| Symptom | Cause | Fix |
|---------|-------|-----|
| `REMOTE_API_NOT_CONFIGURED` | `NEXT_PUBLIC_API_MODE=remote` but empty base URL | Set `NEXT_PUBLIC_API_BASE_URL` |
| CORS error in browser | Origin not in `CORS_ORIGINS` | Add all 3 app URLs to SaaS API env |
| Login works but API 401 | Cookie not sent | `credentials: "include"`; check `SameSite`, `Secure`, domain |
| Mock banner in production | `NEXT_PUBLIC_API_MODE=mock` | Set `remote` + base URL |

---

## Checkout / payments

| Symptom | Cause | Fix |
|---------|-------|-----|
| Paid content not unlocked after return | Skipped `confirm-return` | Always call `POST /api/checkout/{orderId}/confirm-return` |
| Wrong price charged | Client sent amount (ignored) | Price from server catalog only |
| Mock payment stuck pending | Not approved | Dashboard → Approve mock payment (admin) |
| Production startup fails | `PAYMENT_API_MODE=mock` | Set `remote` + `PAYMENT_API_BASE_URL` + token |

---

## Integrations

| Symptom | Cause | Fix |
|---------|-------|-----|
| Reports fail / stub only | `ASTRO_API_MODE=mock` | Set `remote` + Astro URL + token |
| Staging mock rejected | Missing flag | `ALLOW_STAGING_MOCKS=true` |
| Astro timeout | Slow generation | Increase `ASTRO_API_TIMEOUT_MS` |
| Payment API 401 | Missing token | Set `PAYMENT_API_TOKEN` |

---

## Telegram

| Symptom | Cause | Fix |
|---------|-------|-----|
| initData validation 401 | Wrong bot token | Match token to Mini App bot |
| Works locally, fails prod | Dev bypass enabled | `ALLOW_DEV_TELEGRAM_AUTH=false` |
| Connect fails | Invalid token | Validate via `POST .../telegram/validate` first |
| Token leak concern | Token in response | Connect returns status only — verify SaaS code |

---

## Public surfaces / tenant

| Symptom | Cause | Fix |
|---------|-------|-----|
| Partner link 404 | Not published | Publish mini-app + tenant config |
| Wrong products shown | Draft vs published | Public API serves published only |
| Legacy slug fails | Wrong endpoint | Try `/api/public/surfaces/{type}/{slug}` |

---

## Finance

| Symptom | Cause | Fix |
|---------|-------|-----|
| Zero balance | Commissions still pending | Release commissions after hold |
| Payout exceeds available | Draft too large | Check `GET .../balances/{partnerId}` |
| Duplicate commission | Payment sync bug | Check idempotency; verify ledger |

---

## Data / DB

| Symptom | Cause | Fix |
|---------|-------|-----|
| Orders lost after restart | No PostgreSQL / no migration | Run `pnpm db:migrate:saas` |
| Seed data missing | No bootstrap | `pnpm db:seed:saas` or `pnpm pilot:bootstrap` |

---

## Common developer mistakes

1. Setting `ASTRO_API_TOKEN` or `PAYMENT_API_TOKEN` as `NEXT_PUBLIC_*`
2. Frontend calling Astro API :8100 directly
3. Using `birthCity` instead of `birthPlace`
4. Expecting payment return URL to unlock content without `confirm-return`
5. Creator expecting to connect own Stripe — platform owns payments
6. Expecting automatic payouts in pilot — manual only

---

## Diagnostic commands

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
pnpm pilot:preflight
pnpm smoke:local
pnpm docs:check
```

---

## Related

- [FRONTEND_BACKEND_CONNECTION.md](./FRONTEND_BACKEND_CONNECTION.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
