import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  getFinanceStatusLabel,
  getLedgerEntryLabel,
  getPayoutMethodLabel,
  getDictionary,
  t,
} from "@astro/i18n";

const ruDictionary = getDictionary("ru");
const testDir = dirname(fileURLToPath(import.meta.url));
const dashboardRoot = join(testDir, "..");
const builderRoot = join(dashboardRoot, "app/(builder)");
const repoRoot = join(dashboardRoot, "../..");

function readPage(relativePath: string): string {
  return readFileSync(join(builderRoot, relativePath), "utf8");
}

const CREATOR_PRIMARY_ROUTES = [
  "overview",
  "launch/start",
  "payments",
  "balances",
  "payouts",
  "premium-requests",
  "settings",
] as const;

const ADMIN_PAYOUT_ACTION_KEYS = [
  "dashboard.finance.approve",
  "dashboard.finance.markPaid",
  "dashboard.finance.markFailed",
  "dashboard.finance.cancel",
  "dashboard.finance.createDraft",
  "dashboard.finance.release",
  "dashboard.finance.hold",
  "dashboard.finance.selectPartner",
] as const;

const COMMISSION_STATUSES = [
  "pending",
  "available",
  "on_hold",
  "approved",
  "paid",
  "cancelled",
  "adjusted",
] as const;

describe("creator finance navigation (RU)", () => {
  it("uses RU-first nav labels for creator routes", () => {
    assert.equal(t(ruDictionary, "dashboard.layout.payments"), "Продажи");
    assert.equal(t(ruDictionary, "dashboard.layout.balances"), "Баланс");
    assert.equal(t(ruDictionary, "dashboard.layout.payouts"), "Выплаты");
    assert.equal(t(ruDictionary, "dashboard.layout.premiumRequests"), "Заявки");
    assert.equal(t(ruDictionary, "dashboard.layout.promoMaterials"), "Материалы");
  });

  it("excludes ledger and product economics from creator flat nav", () => {
    const layoutSource = readFileSync(join(dashboardRoot, "app/components/DashboardLayout.tsx"), "utf8");
    const financeNavMatch = layoutSource.match(/CREATOR_FINANCE_NAV = \[([\s\S]*?)\] as const/);
    assert.ok(financeNavMatch);
    const financeNavBlock = financeNavMatch[1] ?? "";
    assert.match(financeNavBlock, /href: "payments"/);
    assert.match(financeNavBlock, /href: "balances"/);
    assert.match(financeNavBlock, /href: "payouts"/);
    assert.doesNotMatch(financeNavBlock, /ledger/);
    assert.doesNotMatch(financeNavBlock, /product-economics/);
    assert.doesNotMatch(financeNavBlock, /commissions/);

    const creatorNavMatch = layoutSource.match(/const creatorNav = \[([\s\S]*?)\];/);
    assert.ok(creatorNavMatch);
    const creatorNavBlock = creatorNavMatch[1] ?? "";
    assert.match(creatorNavBlock, /premium-requests/);
    assert.match(creatorNavBlock, /settings/);
    assert.doesNotMatch(creatorNavBlock, /ledger/);
  });

  it("admin finance nav still includes ledger and product economics", () => {
    const layoutSource = readFileSync(join(dashboardRoot, "app/components/DashboardLayout.tsx"), "utf8");
    assert.match(layoutSource, /ADMIN_FINANCE_NAV[\s\S]*ledger/);
    assert.match(layoutSource, /ADMIN_FINANCE_NAV[\s\S]*product-economics/);
  });
});

describe("creator balance copy (RU)", () => {
  it("renders pending/available/hold/paid card labels", () => {
    assert.equal(t(ruDictionary, "dashboard.finance.explainPending"), "В ожидании");
    assert.equal(t(ruDictionary, "dashboard.finance.explainAvailable"), "Доступно к выплате");
    assert.equal(t(ruDictionary, "dashboard.finance.explainHold"), "Удержано");
    assert.equal(t(ruDictionary, "dashboard.finance.explainPaidOut"), "Уже выплачено");
  });

  it("includes finance empty states and pilot payout note", () => {
    assert.match(t(ruDictionary, "dashboard.finance.emptySales"), /Продаж пока нет/);
    assert.match(t(ruDictionary, "dashboard.finance.emptyPayouts"), /Выплат пока нет/);
    assert.match(t(ruDictionary, "dashboard.finance.emptyCommissions"), /Начисления появятся/);
    assert.match(t(ruDictionary, "dashboard.finance.howPayoutsWorkDesc"), /пилоте|вручную/i);
  });
});

describe("creator payouts (RU)", () => {
  it("explains manual payout process", () => {
    assert.match(t(ruDictionary, "dashboard.finance.payoutsManualNote"), /вручную/i);
    assert.match(t(ruDictionary, "dashboard.finance.payoutsAutoNote"), /позже/i);
  });

  it("hides admin payout actions from creator view", () => {
    const source = readPage("payouts/page.tsx");
    assert.match(source, /\{admin &&[\s\S]*createPayout/);
    assert.match(source, /columns={admin \? adminColumns : creatorColumns}/);
    assert.match(source, /notes: admin \?/);
    assert.match(source, /\{!admin &&/);
  });
});

describe("creator sales page visibility", () => {
  it("does not expose provider payload or fees in creator branch", () => {
    const source = readPage("payments/page.tsx");
    assert.doesNotMatch(source, /rawProviderPayload/);
    assert.doesNotMatch(source, /platformReceivedAmount/);
    assert.doesNotMatch(source, /platformMargin/);
    assert.match(source, /admin \? adminColumns : creatorColumns/);
    assert.match(source, /\.\.\.\(admin/);
    assert.match(source, /provider:/);
    assert.match(source, /providerFee/);
    assert.match(source, /emptySales/);
  });
});

describe("creator commissions (RU)", () => {
  it("uses RU status labels for all commission statuses", () => {
    const expected: Record<string, string> = {
      pending: "В ожидании",
      available: "Доступно",
      on_hold: "Удержано",
      approved: "Одобрено",
      paid: "Выплачено",
      cancelled: "Отменено",
      adjusted: "Скорректировано",
    };
    for (const status of COMMISSION_STATUSES) {
      assert.equal(getFinanceStatusLabel(status, "ru", "commission"), expected[status]);
    }
  });

  it("renders empty commissions state for creators", () => {
    const source = readPage("commissions/page.tsx");
    assert.match(source, /emptyCommissions/);
  });
});

describe("operation history visibility", () => {
  it("keeps ledger admin-only via FinanceAdminGuard", () => {
    const ledgerSource = readPage("ledger/page.tsx");
    assert.match(ledgerSource, /FinanceAdminGuard/);
    const economicsSource = readPage("product-economics/page.tsx");
    assert.match(economicsSource, /FinanceAdminGuard/);
  });
});

describe("admin payout actions (RU)", () => {
  it("uses RU labels for admin actions", () => {
    assert.equal(t(ruDictionary, "dashboard.finance.approve"), "Одобрить");
    assert.equal(t(ruDictionary, "dashboard.finance.markPaid"), "Отметить выплаченной");
    assert.equal(t(ruDictionary, "dashboard.finance.markFailed"), "Отметить ошибку");
    assert.equal(t(ruDictionary, "dashboard.finance.createPayoutDraft"), "Создать черновик выплаты");
    assert.equal(t(ruDictionary, "dashboard.finance.release"), "Сделать доступным");
    assert.equal(t(ruDictionary, "dashboard.finance.hold"), "Удержать");
    assert.equal(t(ruDictionary, "dashboard.finance.selectPartner"), "Выбрать партнёра");
    for (const key of ADMIN_PAYOUT_ACTION_KEYS) {
      const label = t(ruDictionary, key);
      assert.notEqual(label, key);
      assert.ok(!/^(Approve|Mark paid|Create draft|Release|Hold|Select partner)$/i.test(label));
    }
  });

  it("retains admin payout management block", () => {
    const source = readPage("payouts/page.tsx");
    assert.match(source, /createPayout/);
    assert.match(source, /updatePayout/);
    assert.match(source, /action: "approve"/);
    assert.match(source, /action: "paid"/);
  });
});

describe("creator access guards (UI source)", () => {
  it("scopes creator balances to partnerId", () => {
    const source = readPage("balances/page.tsx");
    assert.match(source, /listBalances\(tenantId, admin \? undefined : partnerId\)/);
    assert.match(source, /filter\(\(b\) => b\.partnerId === partnerId\)/);
  });

  it("does not show platform margin in creator-facing pages", () => {
    for (const page of ["payments/page.tsx", "balances/page.tsx", "commissions/page.tsx", "payouts/page.tsx"]) {
      const source = readPage(page);
      assert.doesNotMatch(source, /platformMargin/);
      assert.doesNotMatch(source, /rawProviderPayload/);
    }
  });
});

describe("finance status labels", () => {
  it("covers payment/commission/payout statuses in RU", () => {
    assert.equal(getFinanceStatusLabel("paid", "ru", "payment"), "Оплачен");
    assert.equal(getFinanceStatusLabel("paid", "ru", "payout"), "Выплачено");
    assert.equal(getFinanceStatusLabel("available", "ru", "commission"), "Доступно");
    assert.equal(getFinanceStatusLabel("pending_approval", "ru", "payout"), "На согласовании");
    assert.equal(getFinanceStatusLabel("on_hold", "ru", "commission"), "Удержано");
    assert.equal(getFinanceStatusLabel("adjusted", "ru", "commission"), "Скорректировано");
    assert.equal(getFinanceStatusLabel("chargeback", "ru", "payment"), "Спор/chargeback");
  });

  it("covers ledger operation types in RU", () => {
    assert.equal(getLedgerEntryLabel("payment_received", "ru"), "Оплата заказа");
    assert.equal(getLedgerEntryLabel("partner_commission_available", "ru"), "Начисление стало доступно");
    assert.equal(getLedgerEntryLabel("payout_paid", "ru"), "Выплата завершена");
    assert.equal(
      getLedgerEntryLabel("partner_commission_pending", "ru", { audience: "admin" }),
      "Комиссия в ожидании"
    );
  });

  it("localizes payout methods including API enums", () => {
    assert.equal(getPayoutMethodLabel("manual", "ru"), "Вручную");
    assert.equal(getPayoutMethodLabel("paypal", "ru"), "PayPal");
    assert.equal(getPayoutMethodLabel("crypto_usdt", "ru"), "USDT (крипто)");
    assert.equal(getPayoutMethodLabel("other", "ru"), "Другое");
  });
});

describe("archive hygiene script", () => {
  it("excludes node_modules, build artifacts, and cache paths", () => {
    const source = readFileSync(join(repoRoot, "scripts/archive.sh"), "utf8");
    for (const pattern of [
      "node_modules",
      ".next",
      ".turbo",
      "__pycache__",
      "__MACOSX",
      "tsbuildinfo",
      ".cache",
    ]) {
      assert.match(source, new RegExp(pattern));
    }
  });
});
