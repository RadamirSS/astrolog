# Процесс возвратов и корректировок

---

## Manual refund (closed pilot)

Real provider refunds **не реализованы**. Admin marks refund platform-side.

### Steps

1. Dashboard → **Orders** → open order → confirm paid
2. API: `POST /api/dashboard/tenants/{tenantId}/ops/orders/{orderId}/mark-refunded`

```json
{ "reason": "Customer support refund — ticket #123" }
```

### System effects

- Order/payment status → `refunded`
- Commission → `cancelled`
- Ledger → `refund`, `partner_commission_cancelled`
- Entitlement: revoke manually if required

---

## Manual balance adjustment

```json
POST /api/dashboard/tenants/{tenantId}/ops/balances/{partnerId}/adjustments

{ "amount": -10.5, "currency": "USD", "reason": "Correction for duplicate commission" }
```

**Reason required.** Positive credits available; negative debits (cannot exceed available).

---

## Commission hold / release

- **Release**: pending/on_hold → available
- **Hold**: pending/available → on_hold with reason

---

## Audit

Actions log to `audit_logs`: `payment.refunded`, `balance.adjustment`, `commission.release`, `payout.paid`, etc.

---

## Not implemented

- Provider chargebacks/webhooks
- Partial refund splits (use manual adjustment)
- Tax/invoice generation
