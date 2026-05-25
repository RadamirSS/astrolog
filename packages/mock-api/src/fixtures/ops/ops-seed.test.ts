import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { REAL_PRODUCT_CATALOG } from "@astro/tenant-config";
import { MOCK_ORDERS } from "./orders-seed.js";
import {
  computeCommissionSummary,
  computeRevenueSummary,
  buildPartnerLinks,
  getCommissionsForTenant,
  getPaymentsForTenant,
  getBalancesForTenant,
  getLedgerForTenant,
  getPayoutsForTenant,
} from "./index.js";
import { getPartnerById } from "./partners.js";

const LEGACY_DEMO_NAMES = [
  "Shadow Self Report",
  "Ritual Consultation",
  "VIP Natal Consultation",
  "Annual Forecast Dossier",
  "Executive Briefing",
];

describe("ops seed", () => {
  it("orders use real astrology product names only", () => {
    const allowedTitles = new Set(REAL_PRODUCT_CATALOG.flatMap((p) => [p.titleRu, p.titleEn]));
    for (const order of MOCK_ORDERS) {
      assert.ok(allowedTitles.has(order.productTitle), `unexpected product: ${order.productTitle}`);
      for (const legacy of LEGACY_DEMO_NAMES) {
        assert.notEqual(order.productTitle, legacy);
      }
    }
  });

  it("revenue summary matches paid mock orders for tenant_mystic", () => {
    const summary = computeRevenueSummary("tenant_mystic");
    const paid = MOCK_ORDERS.filter(
      (o) => o.tenantId === "tenant_mystic" && o.status === "paid" && o.amount > 0
    );
    const expected = paid.reduce((s, o) => s + o.amount, 0);
    assert.ok(summary.paidOrdersCount >= 1);
    assert.equal(
      Math.round(summary.revenueLast30Days),
      Math.round(expected)
    );
  });

  it("commission equals rate times gross on paid partner orders", () => {
    const commissions = getCommissionsForTenant("tenant_mystic").filter(
      (c) => c.status !== "cancelled" && c.status !== "adjusted" && c.commissionAmount > 0
    );
    for (const c of commissions) {
      const expected = Math.round(c.grossAmount * c.commissionRate * 100) / 100;
      assert.equal(c.commissionAmount, expected);
    }
  });

  it("partner links use /b/{slug} paths", () => {
    const links = buildPartnerLinks("nicole");
    assert.equal(links.general, "/b/nicole");
    assert.equal(links.money, "/b/nicole/money");
    assert.equal(links.relationships, "/b/nicole/relationships");
    assert.equal(links.personality, "/b/nicole/personality");
  });

  it("resolvePartnerBySlug maps to tenant slug", () => {
    const partner = getPartnerById("partner_nicole");
    assert.ok(partner);
    assert.equal(partner!.slug, "nicole");
    assert.equal(partner!.commissionRate, 0.5);
  });

  it("finance seed has payments balances ledger payouts", () => {
    const payments = getPaymentsForTenant("tenant_mystic");
    assert.ok(payments.some((p) => p.status === "paid"));
    assert.ok(payments.some((p) => p.status === "pending"));
    assert.ok(payments.some((p) => p.status === "failed"));
    assert.ok(payments.some((p) => p.status === "refunded"));

    const balances = getBalancesForTenant("tenant_mystic");
    assert.equal(balances.length, 3);

    const ledger = getLedgerForTenant("tenant_mystic");
    assert.ok(ledger.some((e) => e.type === "payment_received"));
    assert.ok(ledger.some((e) => e.type === "partner_commission_pending"));

    const payouts = getPayoutsForTenant("tenant_mystic");
    assert.ok(payouts.some((p) => p.status === "paid"));
    assert.ok(payouts.some((p) => p.status === "draft" || p.status === "approved"));
  });

  it("commission summary uses available not payable", () => {
    const summary = computeCommissionSummary("tenant_mystic");
    assert.ok("available" in summary);
    assert.ok("onHold" in summary);
    assert.equal(typeof summary.available, "number");
  });
});
