# Внешние интеграции

Платформа интегрируется с двумя external service boundaries. **Не реализует** астрологические расчёты и real payment processing.

---

## Astro API

| | |
|---|---|
| **Owns** | birth validation, chart math, report generation, PDF if delegated |
| **Env** | `ASTRO_API_MODE`, `ASTRO_API_BASE_URL`, `ASTRO_API_TOKEN`, `ASTRO_API_TIMEOUT_MS` |
| **Mock** | offline; simulates queued → ready |
| **Remote** | `POST /v1/reports/free`, `POST /v1/reports/paid`, `GET /v1/reports/{id}/status`, `GET /v1/reports/{id}` |

SaaS client: `services/saas-api/src/saas_api/services/astro_client.py`

Frontend **never** calls Astro API. Do not set `ASTRO_API_TOKEN` as `NEXT_PUBLIC_*`.

---

## Payment API

| | |
|---|---|
| **Owns** | payment creation, provider integration, confirmation |
| **Env** | `PAYMENT_API_MODE`, `PAYMENT_API_BASE_URL`, `PAYMENT_API_TOKEN`, `PAYMENT_API_TIMEOUT_MS` |
| **Mock** | mock paymentUrl → miniapp return routes |
| **Remote** | `POST /v1/payments/create`, `GET /v1/payments/{id}/status`, `GET /v1/orders/{id}/payment-status` |

SaaS client: `services/saas-api/src/saas_api/services/payment_client.py`

Creators **do not** connect payment processors. Platform receives all payments.

---

## Telegram Bot API

| | |
|---|---|
| **Owns** | bot token validation (`getMe`), webhook setup (future) |
| **Env** | `TELEGRAM_BOT_SETUP_MODE`, `TELEGRAM_TOKEN_ENCRYPTION_KEY`, `TELEGRAM_BOT_TOKEN` |
| **Per-creator** | token stored encrypted server-side |

See [TELEGRAM_BOT_INTEGRATION.md](./TELEGRAM_BOT_INTEGRATION.md).

---

## Platform lifecycle

Order flow: `created → payment_pending → paid → entitlement (paid_generating) → ready`

Miniapp uses platform API only:
- `generateFreeReport`, `startCheckout`, `confirmPaymentReturn`
- `getUserEntitlements`, `checkReportAccess`

Remote SaaS checkout verifies payment via Payment API before marking paid. **Return URL alone does not unlock entitlements.**

---

## Pilot modes

| Mode | Astro | Payment |
|------|-------|---------|
| Dev demo | mock | mock |
| Staging mock QA | mock or remote | mock + `ALLOW_STAGING_MOCKS` |
| Real pilot | remote | remote |

---

## Security boundaries

```
Browser → SaaS API only
SaaS API → Astro API (ASTRO_API_TOKEN)
SaaS API → Payment API (PAYMENT_API_TOKEN)
SaaS API → Telegram Bot API (encrypted creator tokens)
```

---

## Manual smoke (mock mode)

1. Generate free report via onboarding
2. Product detail → Start purchase → mock payment URL
3. Success return → confirm-return → My Reports
4. Dashboard → Orders → payment/report status

---

## Related

- [PAYMENT_API_CONTRACT.md](./PAYMENT_API_CONTRACT.md)
- [ASTRO_API_CONTRACT.md](./ASTRO_API_CONTRACT.md)
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)
