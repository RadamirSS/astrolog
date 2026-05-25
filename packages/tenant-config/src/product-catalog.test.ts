import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  REAL_PRODUCT_CATALOG,
  getLowTicketProductForTopic,
  createRealProductLine,
} from "./product-catalog.js";
import { REAL_PRODUCT_TYPES } from "./types.js";
import { buildMockFreeReportV2 } from "./report-v2-mock.js";

describe("product catalog", () => {
  it("has all 7 required product types", () => {
    assert.equal(REAL_PRODUCT_TYPES.length, 7);
    for (const type of REAL_PRODUCT_TYPES) {
      assert.ok(REAL_PRODUCT_CATALOG.some((p) => p.productType === type));
    }
  });

  it("maps topics to low ticket products", () => {
    assert.equal(getLowTicketProductForTopic("money"), "low_ticket_money");
    assert.equal(getLowTicketProductForTopic("relationships"), "low_ticket_relationships");
    assert.equal(getLowTicketProductForTopic("personality"), "low_ticket_personality");
  });

  it("createRealProductLine returns 7 products", () => {
    const products = createRealProductLine("test-tenant", "ru");
    assert.equal(products.length, 7);
    assert.ok(products.every((p) => p.productType && p.level && p.visualPack));
  });

  it("money product includes required outline points", () => {
    const money = createRealProductLine("test-tenant", "ru").find(
      (p) => p.productType === "low_ticket_money"
    )!;
    assert.ok(money.reportOutline?.includes("2 дом — личные деньги и самоценность"));
    assert.ok(money.reportOutline?.includes("Главная денежная формула"));
  });

  it("bundle is defined as three separate reports", () => {
    const bundle = createRealProductLine("test-tenant", "ru").find(
      (p) => p.productType === "bundle_all_topics"
    )!;
    assert.match(bundle.longDescription ?? "", /три отдельных/i);
    assert.ok(bundle.reportOutline?.some((line) => line.includes("Денежный код")));
  });
});

describe("report v2 mock", () => {
  it("returns schema v2 with required sections", () => {
    const products = createRealProductLine("test", "ru");
    const report = buildMockFreeReportV2({
      tenantId: "tenant_test",
      birthProfile: {
        name: "Anna",
        birthDate: "1990-06-15",
        birthTime: "14:30",
        timeAccuracy: "exact",
        topic: "money",
      },
      theme: "money",
      locale: "ru",
      products,
    });
    assert.equal(report.schemaVersion, 2);
    const types = report.sections.map((s) => s.type);
    assert.ok(types.includes("hero"));
    assert.ok(types.includes("planet_card"));
    assert.ok(types.includes("cta"));
  });

  it("unknown birth time does not fake precise ascendant", () => {
    const report = buildMockFreeReportV2({
      tenantId: "tenant_test",
      birthProfile: {
        name: "Anna",
        birthDate: "1990-06-15",
        birthTime: null,
        timeAccuracy: "unknown",
        topic: "personality",
      },
      theme: "personality",
      locale: "ru",
      products: createRealProductLine("test", "ru"),
    });
    const asc = report.sections.find((s) => s.planet === "ascendant");
    assert.ok(asc?.uncertain);
    assert.match(asc!.content, /точного времени|exact birth time/i);
    assert.doesNotMatch(asc!.content, /социальный фильтр|social filter/i);
  });
});
