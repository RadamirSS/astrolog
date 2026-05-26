# Модель Commerce Ledger

Финансовый фундамент платформы для closed pilot.

---

## Принципы

1. **Orders** — коммерческое намерение (checkout).
2. **Payments** — подтверждённое движение денег на платформу (реальная обработка — Payment API).
3. **Ledger entries** — append-only финансовая истина.
4. **Partner balances** — derived из commission и payout state.
5. **Commissions** — создаются только после verified paid payment.
6. **Payouts** — уменьшают available balance только через ledger-backed workflow.

---

## Сущности

| Сущность | Таблица | Назначение |
|----------|---------|------------|
| Payment | `payments` | Статус оплаты от external provider |
| Commission | `commissions` | Заработок партнёра (rate snapshotted) |
| PartnerBalance | `partner_balances` | pending / available / on_hold / paid_out |
| LedgerEntry | `ledger_entries` | Append-only audit trail |
| Payout | `payouts` | Manual payout workflow |
| PayoutMethodRecord | `payout_methods` | Placeholder (masked only) |

---

## Lifecycle комиссии

```
paid order → commission pending (hold_until = now + 7 days)
           → admin release → available
           → admin hold → on_hold
           → refund → cancelled
           → payout paid → commission may remain paid/adjusted separately
```

Default hold: `COMMISSION_HOLD_DAYS=7`. В pilot — manual release, без cron.

---

## Типы ledger entries

| Тип | Значение |
|-----|----------|
| `payment_received` | Gross payment received |
| `provider_fee` | Комиссия payment provider |
| `platform_revenue` | Net до partner commission |
| `partner_commission_pending` | Комиссия в hold |
| `partner_commission_available` | Доступна к выплате |
| `partner_commission_hold` | Заморожена admin |
| `partner_commission_cancelled` | Отменена (refund) |
| `refund` | Возврат |
| `manual_adjustment` | Admin correction |
| `payout_created` | Создан draft payout |
| `payout_approved` | Approved, reserved from available |
| `payout_paid` | Выплачено вручную |
| `payout_failed` | Failed — balance restored |
| `payout_cancelled` | Cancelled |

---

## Idempotency

- Unique `(tenant_id, external_payment_id)` on payments
- Unique `order_id` on commissions
- Repeated payment sync must not double-create commission

---

## Бизнес-модель pilot

- **Платформа принимает платежи** — creators не подключают свои processors
- **Выплаты manual** — оператор переводит вне системы, помечает paid в dashboard
- Auto payouts — **не реализованы**

---

## Не реализовано

- Real payment provider SDKs / webhooks
- Automatic payouts (Stripe Connect, bank, crypto)
- Tax reporting, KYC/KYB
- Full double-entry accounting export

---

## Связанные документы

- [CLOSED_PILOT_PAYOUT_RUNBOOK.md](./CLOSED_PILOT_PAYOUT_RUNBOOK.md)
- [REFUND_ADJUSTMENT_PROCESS.md](./REFUND_ADJUSTMENT_PROCESS.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
