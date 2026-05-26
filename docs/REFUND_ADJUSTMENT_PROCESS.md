> **Исторический / English doc.** Актуальная версия: [docs/ru/REFUND_ADJUSTMENT_PROCESS.md](./ru/REFUND_ADJUSTMENT_PROCESS.md)

---

# Refund and Adjustment Process

## Manual refund (closed pilot)

Real payment provider refunds are **not** implemented. Admins mark refund state platform-side.

### Steps

1. Dashboard → **Orders** → open order → confirm payment was paid
2. API: `POST /api/dashboard/tenants/{tenantId}/ops/orders/{orderId}/mark-refunded`

```json
{ "reason": "Customer support refund — ticket #123" }
```

### System effects

- Order/payment status → `refunded`
- Commission → `cancelled` (balance buckets reversed)
- Ledger → `refund`, `partner_commission_cancelled` entries
- Entitlement policy: revoke manually if required (existing entitlement admin actions)

## Manual balance adjustment

For corrections not tied to a specific order:

1. Dashboard → **Balances** → partner detail (or API)
2. `POST /api/dashboard/tenants/{tenantId}/ops/balances/{partnerId}/adjustments`

```json
{ "amount": -10.5, "currency": "USD", "reason": "Correction for duplicate commission" }
```

**Reason is required.** Positive amount credits available balance; negative debits (cannot exceed available).

## Commission hold / release

- **Release**: pending/on_hold → available (admin)
- **Hold**: pending/available → on_hold with reason (admin)

## Audit

All admin mutations log to `audit_logs` with action keys:
- `payment.refunded`
- `balance.adjustment`
- `commission.release`, `commission.hold`
- `payout.create`, `payout.approve`, `payout.paid`, etc.

## Not implemented

- Provider-initiated chargebacks/webhooks
- Partial refund amount splits (use manual adjustment + notes)
- Tax or invoice generation
