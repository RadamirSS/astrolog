import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { astroClient } from "./client.js";
import { getAstroApiMode } from "./config.js";

describe("astroClient mock mode", () => {
  beforeEach(() => {
    process.env.ASTRO_API_MODE = "mock";
    astroClient._resetMockStore();
  });

  it("requestFreeReport returns queued then ready report v2", async () => {
    const response = await astroClient.requestFreeReport({
      tenantId: "tenant_test",
      theme: "relationships",
      locale: "ru",
      birth: {
        name: "Anna",
        birthDate: "1990-05-15",
        birthTime: "14:30",
        timeAccuracy: "exact",
        birthPlace: "Moscow",
      },
    });
    assert.equal(response.status, "queued");
    assert.ok(response.reportId);

    await new Promise((r) => setTimeout(r, 1200));
    const status = await astroClient.getReportStatus(response.reportId);
    assert.equal(status.status, "ready");
    const report = await astroClient.getReportResult(response.reportId);
    assert.equal(report.productType, "free_report");
    assert.equal(report.schemaVersion, 2);
  });

  it("requestPaidReport creates report status flow", async () => {
    const response = await astroClient.requestPaidReport({
      tenantId: "tenant_test",
      orderId: "ord_1",
      entitlementId: "ent_1",
      productType: "low_ticket_relationships",
      theme: "relationships",
      locale: "ru",
      birth: {
        name: "Anna",
        birthDate: "1990-05-15",
        birthTime: null,
        timeAccuracy: "unknown",
        birthPlace: "Moscow",
      },
    });
    assert.equal(response.status, "queued");
    await new Promise((r) => setTimeout(r, 1500));
    const status = await astroClient.getReportStatus(response.reportId);
    assert.equal(status.status, "ready");
  });
});

describe("astroClient remote mode", () => {
  it("fails gracefully if config missing", async () => {
    process.env.ASTRO_API_MODE = "remote";
    delete process.env.ASTRO_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_ASTRO_API_BASE_URL;
    await assert.rejects(
      () => astroClient.requestFreeReport({
        tenantId: "t",
        theme: "money",
        locale: "ru",
        birth: {
          name: "A",
          birthDate: "1990-01-01",
          timeAccuracy: "unknown",
          birthPlace: "X",
        },
      }),
      /ASTRO_API_BASE_URL/
    );
    process.env.ASTRO_API_MODE = "mock";
  });
});

describe("astro config", () => {
  it("defaults to mock mode", () => {
    delete process.env.ASTRO_API_MODE;
    assert.equal(getAstroApiMode(), "mock");
  });
});
