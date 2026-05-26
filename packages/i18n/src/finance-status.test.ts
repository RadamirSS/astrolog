import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getFinanceStatusLabel, getLedgerEntryLabel, getPayoutMethodLabel } from "./finance-status";

const PAYMENT_STATUSES = [
  ["created", "Создан"],
  ["pending", "Ожидает оплаты"],
  ["paid", "Оплачен"],
  ["failed", "Ошибка оплаты"],
  ["cancelled", "Отменён"],
  ["expired", "Истёк"],
  ["refunded", "Возврат"],
  ["partially_refunded", "Частичный возврат"],
  ["chargeback", "Спор/chargeback"],
] as const;

const COMMISSION_STATUSES = [
  ["pending", "В ожидании"],
  ["available", "Доступно"],
  ["on_hold", "Удержано"],
  ["approved", "Одобрено"],
  ["paid", "Выплачено"],
  ["cancelled", "Отменено"],
  ["adjusted", "Скорректировано"],
] as const;

const PAYOUT_STATUSES = [
  ["draft", "Черновик"],
  ["pending_approval", "На согласовании"],
  ["approved", "Одобрено"],
  ["processing", "В обработке"],
  ["paid", "Выплачено"],
  ["failed", "Ошибка"],
  ["cancelled", "Отменено"],
] as const;

const LEDGER_STATUSES = [
  ["pending", "В ожидании"],
  ["posted", "Проведено"],
  ["voided", "Аннулировано"],
  ["reversed", "Сторнировано"],
] as const;

const LEDGER_TYPES_CREATOR = [
  ["payment_received", "Оплата заказа"],
  ["provider_fee", "Комиссия провайдера"],
  ["partner_commission_pending", "Начисление комиссии"],
  ["partner_commission_available", "Начисление стало доступно"],
  ["partner_commission_hold", "Удержание"],
  ["partner_commission_cancelled", "Комиссия отменена"],
  ["partner_commission_adjusted", "Корректировка"],
  ["refund", "Возврат"],
  ["chargeback", "Спор/chargeback"],
  ["manual_adjustment", "Ручная корректировка"],
  ["payout_created", "Выплата создана"],
  ["payout_approved", "Выплата одобрена"],
  ["payout_paid", "Выплата завершена"],
  ["payout_failed", "Ошибка выплаты"],
  ["payout_cancelled", "Выплата отменена"],
] as const;

const LEDGER_TYPES_ADMIN = [
  ["partner_commission_pending", "Комиссия в ожидании"],
  ["partner_commission_available", "Комиссия доступна"],
  ["partner_commission_hold", "Комиссия удержана"],
  ["partner_commission_adjusted", "Комиссия скорректирована"],
] as const;

describe("getFinanceStatusLabel", () => {
  it("returns RU payment labels (PART 8)", () => {
    for (const [status, label] of PAYMENT_STATUSES) {
      assert.equal(getFinanceStatusLabel(status, "ru", "payment"), label);
    }
  });

  it("returns RU commission labels (PART 8)", () => {
    for (const [status, label] of COMMISSION_STATUSES) {
      assert.equal(getFinanceStatusLabel(status, "ru", "commission"), label);
    }
  });

  it("returns RU payout labels (PART 8)", () => {
    for (const [status, label] of PAYOUT_STATUSES) {
      assert.equal(getFinanceStatusLabel(status, "ru", "payout"), label);
    }
  });

  it("returns RU ledger entry status labels", () => {
    for (const [status, label] of LEDGER_STATUSES) {
      assert.equal(getFinanceStatusLabel(status, "ru", "ledger"), label);
    }
  });

  it("returns EN payment labels", () => {
    assert.equal(getFinanceStatusLabel("paid", "en", "payment"), "Paid");
    assert.equal(getFinanceStatusLabel("refunded", "en", "payment"), "Refunded");
  });

  it("maps entitlement statuses", () => {
    assert.equal(getFinanceStatusLabel("paid_generating", "ru", "entitlement"), "Готовится");
    assert.equal(getFinanceStatusLabel("ready", "ru", "entitlement"), "Готово");
  });
});

describe("getLedgerEntryLabel", () => {
  it("maps creator-friendly ledger types in RU", () => {
    for (const [type, label] of LEDGER_TYPES_CREATOR) {
      assert.equal(getLedgerEntryLabel(type, "ru"), label);
    }
  });

  it("maps admin ledger commission types in RU", () => {
    for (const [type, label] of LEDGER_TYPES_ADMIN) {
      assert.equal(getLedgerEntryLabel(type, "ru", { audience: "admin" }), label);
    }
  });
});

describe("getPayoutMethodLabel", () => {
  it("maps payout methods", () => {
    assert.equal(getPayoutMethodLabel("manual", "ru"), "Вручную");
    assert.equal(getPayoutMethodLabel("bank_transfer", "en"), "Bank transfer");
    assert.equal(getPayoutMethodLabel("paypal", "ru"), "PayPal");
    assert.equal(getPayoutMethodLabel("crypto_usdt", "ru"), "USDT (крипто)");
    assert.equal(getPayoutMethodLabel("other", "en"), "Other");
  });
});
