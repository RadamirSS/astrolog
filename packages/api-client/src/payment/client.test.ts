import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import { paymentClient } from "./client.js";
import { getPaymentApiMode } from "./config.js";

describe("paymentClient mock mode", () => {
  beforeEach(() => {
    process.env.PAYMENT_API_MODE = "mock";
    paymentClient._resetMockStore();
  });

  it("createPayment returns payment id and pending status", async () => {
    const result = await paymentClient.createPayment({
      orderId: "ord_test",
      tenantId: "tenant_test",
      tenantSlug: "mystic-dark",
      productType: "low_ticket_money",
      productTitle: "Money code",
      amount: 29,
      currency: "USD",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
      pendingUrl: "http://localhost/pending",
    });
    assert.ok(result.paymentId.startsWith("pay_"));
    assert.ok(result.paymentUrl.includes("orderId=ord_test"));
    assert.equal(result.status, "created");
  });

  it("getPaymentStatus returns stored payment", async () => {
    const created = await paymentClient.createPayment({
      orderId: "ord_test2",
      tenantId: "tenant_test",
      tenantSlug: "mystic-dark",
      productType: "low_ticket_money",
      productTitle: "Money code",
      amount: 29,
      currency: "USD",
      successUrl: "http://localhost/success",
      cancelUrl: "http://localhost/cancel",
      pendingUrl: "http://localhost/pending",
    });
    paymentClient._mockMarkPaid(created.paymentId);
    const status = await paymentClient.getPaymentStatus(created.paymentId);
    assert.equal(status.status, "paid");
  });
});

describe("paymentClient remote mode", () => {
  it("fails gracefully if config missing", async () => {
    process.env.PAYMENT_API_MODE = "remote";
    delete process.env.PAYMENT_API_BASE_URL;
    delete process.env.NEXT_PUBLIC_PAYMENT_API_BASE_URL;
    await assert.rejects(
      () =>
        paymentClient.createPayment({
          orderId: "ord_x",
          tenantId: "t",
          productType: "low_ticket_money",
          productTitle: "Test",
          amount: 29,
          currency: "USD",
          successUrl: "http://localhost/s",
          cancelUrl: "http://localhost/c",
          pendingUrl: "http://localhost/p",
        }),
      /PAYMENT_API_BASE_URL/
    );
    process.env.PAYMENT_API_MODE = "mock";
  });
});

describe("payment config", () => {
  it("defaults to mock mode", () => {
    delete process.env.PAYMENT_API_MODE;
    assert.equal(getPaymentApiMode(), "mock");
  });
});
