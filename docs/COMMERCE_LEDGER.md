> **Исторический / English doc.** Актуальная версия: [docs/ru/COMMERCE_LEDGER.md](./ru/COMMERCE_LEDGER.md)

---

# Commerce Ledger Model

This document describes the platform-side financial foundation for the closed pilot.

## Principles

1. **Orders** express commercial intent.
2. **Payments** record confirmed money movement into the platform (external Payment API owns real processing).
3. **Ledger entries** are append-only financial truth.
4. **Partner balances** are derived from commission and payout state.
5. **Commissions** are created only after verified paid payment.
6. **Payouts** reduce available balance only through ledger-backed workflow.

## Entities

| Entity | Table | Purpose |
|--------|-------|---------|
| Payment | `payments` | Confirmed/changed payment state from external provider |
| Commission | `commissions` | Partner earnings per paid order (rate snapshotted) |
| PartnerBalance | `partner_balances` | Pending / available / on_hold / paid_out buckets |
| LedgerEntry | `ledger_entries` | Append-only audit trail |
| Payout | `payouts` | Manual payout workflow |
| PayoutMethodRecord | `payout_methods` | Placeholder for future provider tokens (masked only) |

## Commission lifecycle

```
paid order → commission pending (hold_until = now + 7 days)
           → admin release → available
           → admin hold → on_hold
           → refund → cancelled
           → payout paid → commission may remain paid/adjusted separately
```

Default hold: `COMMISSION_HOLD_DAYS=7` (configurable). No automatic cron in pilot — admin manual release.

## Ledger types

Preferred terminology vs stored enum names:

| Enum / field | Meaning |
|--------------|---------|
| `payment_received` | Gross payment received |
| `provider_fee` | Payment provider fee |
| `platform_revenue` | Net received before partner commission (not final platform profit) |
| `partner_commission_*` | Partner commission lifecycle buckets |
| `refund` | Refund reversal |
| `manual_adjustment` | Admin balance correction with reason |
| `payout_*` | Manual payout workflow events |

Stored types:
- `partner_commission_pending`, `partner_commission_available`, `partner_commission_hold`, `partner_commission_cancelled`
- `refund`, `manual_adjustment`
- `payout_created`, `payout_approved`, `payout_paid`, `payout_failed`, `payout_cancelled`

## Idempotency

- Unique `(tenant_id, external_payment_id)` on payments
- Unique `order_id` on commissions
- Repeated payment sync must not double-create commission or ledger credit

## Not implemented

- Real payment provider SDKs / webhooks
- Automatic payouts (Stripe Connect, bank, crypto)
- Tax reporting, KYC/KYB
- Full double-entry accounting export

See also: [CLOSED_PILOT_PAYOUT_RUNBOOK.md](./CLOSED_PILOT_PAYOUT_RUNBOOK.md), [REFUND_ADJUSTMENT_PROCESS.md](./REFUND_ADJUSTMENT_PROCESS.md)
