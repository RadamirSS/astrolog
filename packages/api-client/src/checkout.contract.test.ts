import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { startCheckoutRequestSchema } from "@astro/api-contracts";

describe("startCheckoutRequestSchema", () => {
  it("rejects trusted commercial fields from public checkout request", () => {
    const result = startCheckoutRequestSchema.safeParse({
      tenantId: "tenant_mystic",
      tenantSlug: "mystic-dark",
      productId: "mystic-dark-money-code",
      productType: "low_ticket_money",
      amount: 0,
      currency: "EUR",
      productTitle: "Fake title",
    });
    assert.equal(result.success, false);
  });

  it("accepts catalog-only checkout request", () => {
    const result = startCheckoutRequestSchema.safeParse({
      tenantId: "tenant_mystic",
      tenantSlug: "mystic-dark",
      productId: "mystic-dark-money-code",
      productType: "low_ticket_money",
      theme: "money",
    });
    assert.equal(result.success, true);
  });
});
