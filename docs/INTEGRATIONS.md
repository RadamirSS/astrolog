> **Исторический / English doc.** Актуальная версия: [docs/ru/INTEGRATIONS.md](./ru/INTEGRATIONS.md)

---

# External API Integrations (Package 4)

This platform integrates with two external service boundaries. It does **not** implement astrology calculations or real payment processing.

## Astro API

- **Owns:** birth validation, chart math, report generation, PDF if delegated
- **Env:** `ASTRO_API_MODE`, `ASTRO_API_BASE_URL`, `ASTRO_API_TOKEN`, `ASTRO_API_TIMEOUT_MS`
- **Mock mode (default):** works offline; simulates queued → ready report flow
- **Remote mode:** calls `POST /v1/reports/free`, `POST /v1/reports/paid`, `GET /v1/reports/{id}/status`, `GET /v1/reports/{id}`

Client: `packages/api-client/src/astro/`

## Payment API

- **Owns:** real payment creation, provider integration, confirmation
- **Env:** `PAYMENT_API_MODE`, `PAYMENT_API_BASE_URL`, `PAYMENT_API_TOKEN`, `PAYMENT_API_TIMEOUT_MS`
- **Mock mode (default):** returns mock payment URL pointing to miniapp return routes
- **Remote mode:** calls `POST /v1/payments/create`, `GET /v1/payments/{id}/status`

Client: `packages/api-client/src/payment/`

## Platform lifecycle

Order flow: `created → payment_pending → paid → entitlement (paid_generating) → ready`

Orchestration: `packages/api-client/src/services/order-lifecycle.ts` (mock mode via `@astro/mock-api` store)

Miniapp uses platform API (`generateFreeReport`, `startCheckout`, `confirmPaymentReturn`, `getUserEntitlements`, `checkReportAccess`) — not external Astro/Payment tokens in the browser.

Remote SaaS checkout verifies payment status via Payment API before marking an order paid. A payment success return URL alone does not unlock entitlements.

## Manual smoke (mock mode)

1. Generate free report via onboarding
2. Open product detail → Start purchase → follow mock payment URL
3. Complete success return → check My Reports for generating/ready state
4. Dashboard → Orders → Check payment/report status, retry if failed

## Security

- Do not set `ASTRO_API_TOKEN` or `PAYMENT_API_TOKEN` as `NEXT_PUBLIC_*`
- Paid report access requires server-side entitlement check
