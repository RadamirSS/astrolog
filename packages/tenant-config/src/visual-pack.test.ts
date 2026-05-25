import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createRealProductLine } from "./product-catalog.js";
import {
  getLandingVisualPack,
  getVisualPackForProduct,
  getVisualPackForReport,
  getVisualPackForTopic,
  getVisualPackLabel,
} from "./visual-pack.js";
import { buildMockFreeReportV2 } from "./report-v2-mock.js";

describe("visual pack mapping", () => {
  it("maps topics to correct visual packs", () => {
    assert.equal(getVisualPackForTopic("money"), "dark_gold_mystic");
    assert.equal(getVisualPackForTopic("relationships"), "pink_love");
    assert.equal(getVisualPackForTopic("personality"), "cosmic_pastel");
  });

  it("maps landing to sky_clarity", () => {
    assert.equal(getLandingVisualPack(), "sky_clarity");
  });

  it("maps main and premium products to dark_gold_mystic", () => {
    const products = createRealProductLine("test", "ru");
    const main = products.find((p) => p.productType === "main_natal_portrait")!;
    const premium = products.find((p) => p.productType === "premium_consultation")!;
    assert.equal(getVisualPackForProduct(main), "dark_gold_mystic");
    assert.equal(getVisualPackForProduct(premium), "dark_gold_mystic");
  });

  it("maps low ticket products by topic", () => {
    const products = createRealProductLine("test", "ru");
    const money = products.find((p) => p.productType === "low_ticket_money")!;
    const rel = products.find((p) => p.productType === "low_ticket_relationships")!;
    const pers = products.find((p) => p.productType === "low_ticket_personality")!;
    assert.equal(getVisualPackForProduct(money), "dark_gold_mystic");
    assert.equal(getVisualPackForProduct(rel), "pink_love");
    assert.equal(getVisualPackForProduct(pers), "cosmic_pastel");
  });

  it("returns human-readable labels", () => {
    assert.equal(getVisualPackLabel("dark_gold_mystic", "ru"), "Тёмное золото");
    assert.equal(getVisualPackLabel("pink_love", "en"), "Pink Love");
  });

  it("getVisualPackForReport uses report visualPack", () => {
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
    assert.equal(getVisualPackForReport(report), report.visualPack);
    assert.ok(["sky_clarity", "cosmic_pastel"].includes(report.visualPack));
  });
});

describe("paywall tier completeness", () => {
  it("catalog has all 5 paywall levels", () => {
    const products = createRealProductLine("test", "ru");
    const levels = new Set(products.map((p) => p.level));
    assert.ok(levels.has("free"));
    assert.ok(levels.has("low_ticket"));
    assert.ok(levels.has("bundle"));
    assert.ok(levels.has("main"));
    assert.ok(levels.has("premium"));
  });
});
