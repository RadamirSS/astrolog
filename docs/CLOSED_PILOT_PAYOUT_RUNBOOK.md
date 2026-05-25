# Closed Pilot Manual Payout Runbook

Manual payout process for platform admins during closed pilot. **No real money movement is automated by this platform.**

## Prerequisites

- Migration `005_finance_ledger` applied
- Partner has **available balance** (commissions released from pending)
- Platform admin session (payout actions require admin role)

## Workflow

### 1. Verify partner balance

Dashboard → **Balances** → confirm `availableBalance` for partner/currency.

Or API: `GET /api/dashboard/tenants/{tenantId}/ops/balances/{partnerId}`

### 2. Release pending commissions (if needed)

Dashboard → **Commissions** → **Release** on pending rows.

Hold period default is 7 days; pilot allows early manual release.

### 3. Create payout draft

Dashboard → **Payouts** → select partner, amount ≤ available balance → **Create draft**.

API: `POST /api/dashboard/tenants/{tenantId}/ops/payouts`

```json
{ "partnerId": "partner_nicole", "amount": 100, "currency": "USD", "notes": "May payout" }
```

### 4. Approve payout

Dashboard → **Payouts** → **Approve** (reserves amount from available balance).

### 5. Execute transfer outside platform

Perform actual bank/PayPal/manual transfer using your organization's process.  
Record reference in payout notes if helpful.

### 6. Mark payout paid

Dashboard → **Payouts** → **Mark paid**.

This increases `paidOutTotal` and posts `payout_paid` ledger entry.

### 7. Verify ledger

Dashboard → **Ledger** → filter by partner or payout id.

## Failure handling

- **Mark failed**: restores available balance if payout was approved
- **Cancel**: cancels draft/approved payout before paid

## Future automatic payouts

Fields `provider`, `external_payout_id` on `payouts` and `payout_methods.external_token` are placeholders for Package 14+ integration. Not operational in pilot.
