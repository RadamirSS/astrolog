import type { Commission } from "@astro/api-contracts";
import { getPartnerById } from "./partners";
import { MOCK_ORDERS } from "./orders-seed";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function buildCommissionFromOrder(
  order: (typeof MOCK_ORDERS)[0],
  status: Commission["status"],
  overrides?: Partial<Commission>
): Commission {
  const partner = order.partnerId ? getPartnerById(order.partnerId) : undefined;
  const rate = partner?.commissionRate ?? 0;
  const gross = order.amount;
  const commissionAmount = Math.round(gross * rate * 100) / 100;
  return {
    id: `comm_${order.id}`,
    tenantId: order.tenantId,
    partnerId: order.partnerId ?? "direct",
    partnerName: partner?.name ?? "Direct",
    orderId: order.id,
    productType: order.productType,
    productTitle: order.productTitle,
    grossAmount: gross,
    currency: order.currency,
    commissionRate: rate,
    commissionAmount,
    status,
    holdUntil: status === "pending" ? daysFromNow(7) : undefined,
    createdAt: order.paidAt ?? order.createdAt,
    ...overrides,
  };
}

const paidWithPartner = MOCK_ORDERS.filter(
  (o) => o.status === "paid" && o.partnerId && o.amount > 0
);

export const MOCK_COMMISSIONS: Commission[] = [
  ...paidWithPartner.slice(0, 12).map((o, i) =>
    buildCommissionFromOrder(
      o,
      i < 3 ? "pending" : i < 5 ? "available" : i < 7 ? "on_hold" : i < 9 ? "paid" : "approved",
      {
        availableAt: i >= 3 && i < 7 ? daysAgo(3) : undefined,
        paidAt: i >= 7 && i < 9 ? daysAgo(2) : undefined,
      }
    )
  ),
  buildCommissionFromOrder(
    MOCK_ORDERS.find((o) => o.id === "ord_007")!,
    "adjusted",
    { commissionAmount: 0, adjustmentReason: "Manual correction" }
  ),
  buildCommissionFromOrder(
    MOCK_ORDERS.find((o) => o.id === "ord_006")!,
    "cancelled",
    { commissionAmount: 0, cancelledAt: daysAgo(4) }
  ),
];

export function getCommissionsForTenant(tenantId: string): Commission[] {
  return MOCK_COMMISSIONS.filter((c) => c.tenantId === tenantId);
}
