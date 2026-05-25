import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createDemoReportLibrary, createMockReportLibrary, createRealProductLine } from "./product-catalog.js";
import { syncReportLibraryWithEntitlements, syncReportLibraryWithSession } from "./report-library.js";

describe("report library sync", () => {
  it("does not show free report as ready without session report", () => {
    const library = createMockReportLibrary("test-tenant", "ru");
    const free = library.find((item) => item.productType === "free_report");
    assert.ok(free);
    assert.equal(free.status, "locked");
    assert.equal(free.reportId, undefined);
  });

  it("marks free report ready when session report exists", () => {
    const library = createMockReportLibrary("test-tenant", "ru");
    const synced = syncReportLibraryWithSession(library, {
      tenantSlug: "test-tenant",
      locale: "ru",
      report: { id: "report-123" },
    });
    const free = synced.find((item) => item.productType === "free_report");
    assert.equal(free?.status, "ready");
    assert.equal(free?.reportId, "report-123");
  });

  it("locks free report when session report is cleared", () => {
    const library = createMockReportLibrary("test-tenant", "ru");
    const ready = syncReportLibraryWithSession(library, {
      tenantSlug: "test-tenant",
      report: { id: "report-123" },
    });
    const locked = syncReportLibraryWithSession(ready, {
      tenantSlug: "test-tenant",
      report: null,
    });
    const free = locked.find((item) => item.productType === "free_report");
    assert.equal(free?.status, "locked");
    assert.equal(free?.reportId, undefined);
  });
});

describe("product catalog prices", () => {
  it("uses dollar labels for paid products", () => {
    const products = createRealProductLine("test", "ru");
    const money = products.find((p) => p.productType === "low_ticket_money")!;
    const bundle = products.find((p) => p.productType === "bundle_all_topics")!;
    const main = products.find((p) => p.productType === "main_natal_portrait")!;
    assert.equal(money.priceLabel, "$29");
    assert.equal(bundle.priceLabel, "$79");
    assert.equal(main.priceLabel, "$149");
    assert.doesNotMatch(money.priceLabel ?? "", /₽/);
  });
});

describe("paid report entitlement sync", () => {
  it("does not show paid report as ready without entitlement", () => {
    const library = createMockReportLibrary("test-tenant", "ru");
    const paidReady = library.find(
      (item) => item.productType !== "free_report" && item.status === "ready"
    );
    assert.equal(paidReady, undefined);
  });

  it("downgrades paid ready items without entitlement", () => {
    const library = createDemoReportLibrary("test-tenant", "ru");
    const synced = syncReportLibraryWithEntitlements(library, {
      tenantSlug: "test-tenant",
      locale: "ru",
      entitlements: [],
      report: null,
    });
    const paidReady = synced.find(
      (item) => item.productType !== "free_report" && item.status === "ready"
    );
    assert.equal(paidReady, undefined);
  });
});

describe("demo report library coverage", () => {
  it("includes pending_payment demo item in demo library", () => {
    const library = createDemoReportLibrary("test-tenant", "ru");
    const pending = library.find((item) => item.status === "pending_payment");
    assert.ok(pending);
    assert.equal(pending.productType, "low_ticket_money");
  });
});
