# Runbook: ручные выплаты (Closed Pilot)

Процесс manual payout для platform admins. **Платформа не автоматизирует перевод денег.**

---

## Предусловия

- Migration `005_finance_ledger` applied
- Partner имеет **available balance** (commissions released from pending)
- Platform admin session

---

## Workflow

### 1. Проверить баланс партнёра

Dashboard → **Балансы** → confirm `availableBalance`.

API: `GET /api/dashboard/tenants/{tenantId}/ops/balances/{partnerId}`

### 2. Release pending commissions (если нужно)

Dashboard → **Комиссии** → **Release** на pending rows.

Hold period default — 7 дней; pilot допускает early manual release.

### 3. Создать draft payout

Dashboard → **Выплаты** → partner, amount ≤ available → **Create draft**.

```json
{
  "partnerId": "partner_nicole",
  "amount": 100,
  "currency": "USD",
  "notes": "Выплата за май"
}
```

### 4. Approve payout

Dashboard → **Выплаты** → **Approve** (резервирует amount из available).

### 5. Выполнить перевод вне платформы

Bank/PayPal/manual transfer по процессу организации. Записать reference в notes.

### 6. Mark payout paid

Dashboard → **Выплаты** → **Mark paid**.

Увеличивает `paidOutTotal`, создаёт `payout_paid` ledger entry.

### 7. Verify ledger

Dashboard → **Журнал операций** → filter by partner/payout id.

---

## Failure handling

- **Mark failed**: restores available balance if approved
- **Cancel**: cancels draft/approved before paid

---

## Будущие auto payouts

Fields `provider`, `external_payout_id`, `payout_methods.external_token` — placeholders. **Не operational в pilot.**

---

## Related

- [COMMERCE_LEDGER.md](./COMMERCE_LEDGER.md)
- [CLOSED_PILOT_RUNBOOK.md](./CLOSED_PILOT_RUNBOOK.md)
