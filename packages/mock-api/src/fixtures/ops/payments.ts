import type { Payment } from "@astro/api-contracts";
import { MOCK_ORDERS } from "./orders-seed";
import { getPartnerById } from "./partners";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function paymentFromOrder(
  order: (typeof MOCK_ORDERS)[0],
  status: Payment["status"],
  overrides?: Partial<Payment>
): Payment {
  const partner = order.partnerId ? getPartnerById(order.partnerId) : undefined;
  return {
    id: `pay_${order.id.replace("ord_", "")}`,
    tenantId: order.tenantId,
    orderId: order.id,
    userId: order.userId,
    partnerId: order.partnerId,
    partnerName: partner?.name,
    productTitle: order.productTitle,
    provider: "mock",
    externalPaymentId: order.externalPaymentId ?? `pay_mock_${order.id}`,
    amount: order.amount,
    currency: order.currency,
    status,
    providerFee: status === "paid" ? Math.round(order.amount * 0.03 * 100) / 100 : null,
    platformReceivedAmount:
      status === "paid"
        ? Math.round(order.amount * 0.97 * 100) / 100
        : null,
    createdAt: order.createdAt,
    confirmedAt: status === "paid" ? (order.paidAt ?? order.createdAt) : null,
    failedAt: status === "failed" ? daysAgo(2) : null,
    refundedAt: status === "refunded" ? (order.refundedAt ?? daysAgo(1)) : null,
    ...overrides,
  };
}

const paidOrders = MOCK_ORDERS.filter((o) => o.status === "paid" && o.amount > 0);
const pendingOrders = MOCK_ORDERS.filter((o) => o.status === "payment_pending");
const failedOrders = MOCK_ORDERS.filter((o) => o.status === "failed");
const refundedOrders = MOCK_ORDERS.filter((o) => o.status === "refunded");

export const MOCK_PAYMENTS: Payment[] = [
  ...paidOrders.slice(0, 8).map((o) => paymentFromOrder(o, "paid")),
  ...pendingOrders.slice(0, 2).map((o) => paymentFromOrder(o, "pending")),
  ...failedOrders.slice(0, 2).map((o) => paymentFromOrder(o, "failed")),
  ...refundedOrders.slice(0, 1).map((o) => paymentFromOrder(o, "refunded")),
];

export function getPaymentsForTenant(tenantId: string, partnerId?: string): Payment[] {
  let items = MOCK_PAYMENTS.filter((p) => p.tenantId === tenantId);
  if (partnerId) {
    items = items.filter((p) => p.partnerId === partnerId);
  }
  return items;
}

export function getPaymentById(paymentId: string): Payment | undefined {
  return MOCK_PAYMENTS.find((p) => p.id === paymentId);
}
