import type {
  CommissionSummary,
  Order,
  OrderListParams,
  PartnerDetail,
  PartnerLinkSet,
  ProductEconomicsRow,
  RevenueSummary,
} from "@astro/api-contracts";
import { REAL_PRODUCT_CATALOG } from "@astro/tenant-config";
import { getCommissionsForTenant } from "./commissions";
import { getPaymentsForTenant, getPaymentById } from "./payments";
import { getBalancesForTenant, getBalanceForPartner } from "./balances";
import { getLedgerForTenant } from "./ledger";
import { getFunnelAnalyticsForTenant } from "./funnel-analytics";
import { getOrdersForTenant, getOrderById } from "./orders";
import {
  getAllOrders,
  upsertOrder,
  createOrderId,
  createEntitlementId,
  getEntitlementById,
  getEntitlementByOrderId,
  upsertEntitlement,
  getEntitlementsForUser,
  ensureOrderStore,
  resetOrderStore,
  setOrderBirthContext,
  getOrderBirthContext,
} from "./order-store";
import {
  getPartnersForTenant,
  getPartnerById,
  resolvePartnerBySlug,
} from "./partners";
import { resolvePublicPartnerConfig } from "./public-partner";
import { getPayoutsForTenant, getPayoutById, updatePayoutInStore, createPayoutInStore } from "./payouts";
import { getPromoMaterialsForTenant, buildPartnerLinks } from "./promo-materials";

export {
  getOrdersForTenant,
  getOrderById,
  getAllOrders,
  upsertOrder,
  createOrderId,
  createEntitlementId,
  getEntitlementById,
  getEntitlementByOrderId,
  upsertEntitlement,
  getEntitlementsForUser,
  ensureOrderStore,
  resetOrderStore,
  setOrderBirthContext,
  getOrderBirthContext,
  getPartnersForTenant,
  getPartnerById,
  resolvePartnerBySlug,
  resolvePublicPartnerConfig,
  getCommissionsForTenant,
  getPaymentsForTenant,
  getPaymentById,
  getBalancesForTenant,
  getBalanceForPartner,
  getLedgerForTenant,
  getPayoutsForTenant,
  getPayoutById,
  updatePayoutInStore,
  createPayoutInStore,
  getPromoMaterialsForTenant,
  buildPartnerLinks,
  getFunnelAnalyticsForTenant,
};

const API_COST_BY_LEVEL: Record<string, number> = {
  free: 0.5,
  low_ticket: 2.5,
  bundle: 6,
  main: 12,
  premium: 25,
};

function isWithinDays(iso: string, days: number): boolean {
  const d = new Date(iso);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return d >= cutoff;
}

function isToday(iso: string): boolean {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export function filterOrders(orders: Order[], params?: OrderListParams): Order[] {
  return orders.filter((o) => {
    if (params?.status && o.status !== params.status) return false;
    if (params?.productType && o.productType !== params.productType) return false;
    if (params?.partnerId && o.partnerId !== params.partnerId) return false;
    if (params?.theme && o.theme !== params.theme) return false;
    if (params?.dateFrom && o.createdAt < params.dateFrom) return false;
    if (params?.dateTo && o.createdAt > params.dateTo) return false;
    return true;
  });
}

export function computeRevenueSummary(tenantId: string): RevenueSummary {
  const orders = getOrdersForTenant(tenantId);
  const paid = orders.filter((o) => o.status === "paid" && o.amount > 0);
  const refunded = orders.filter((o) => o.status === "refunded");

  const sumAmount = (list: Order[]) => list.reduce((s, o) => s + o.amount, 0);

  const paidToday = paid.filter((o) => isToday(o.paidAt ?? o.createdAt));
  const paid7d = paid.filter((o) => isWithinDays(o.paidAt ?? o.createdAt, 7));
  const paid30d = paid.filter((o) => isWithinDays(o.paidAt ?? o.createdAt, 30));

  function breakdown(
    keyFn: (o: Order) => string,
    labelFn: (key: string, o: Order) => string
  ) {
    const map = new Map<string, { revenue: number; orderCount: number; label: string }>();
    for (const o of paid) {
      const key = keyFn(o);
      const label = labelFn(key, o);
      const cur = map.get(key) ?? { revenue: 0, orderCount: 0, label };
      cur.revenue += o.amount;
      cur.orderCount += 1;
      map.set(key, cur);
    }
    return Array.from(map.entries()).map(([key, v]) => ({
      key,
      label: v.label,
      revenue: v.revenue,
      orderCount: v.orderCount,
    }));
  }

  return {
    revenueToday: sumAmount(paidToday),
    revenueLast7Days: sumAmount(paid7d),
    revenueLast30Days: sumAmount(paid30d),
    paidOrdersCount: paid.length,
    averageOrderValue: paid.length ? sumAmount(paid) / paid.length : 0,
    refundsAmount: sumAmount(refunded),
    refundsCount: refunded.length,
    byProduct: breakdown(
      (o) => o.productType,
      (_, o) => o.productTitle
    ),
    byTheme: breakdown(
      (o) => o.theme ?? "none",
      (key) => (key === "none" ? "No theme" : key)
    ),
    byPartner: breakdown(
      (o) => o.partnerId ?? "direct",
      (key, o) => o.partnerSlug ?? (key === "direct" ? "Direct" : key)
    ),
  };
}

export function computeProductEconomics(tenantId: string): ProductEconomicsRow[] {
  const orders = getOrdersForTenant(tenantId);
  const paid = orders.filter((o) => o.status === "paid" && o.amount > 0);
  const commissions = getCommissionsForTenant(tenantId).filter(
    (c) =>
      c.status === "paid" ||
      c.status === "approved" ||
      c.status === "available" ||
      c.status === "pending"
  );
  const funnel = getFunnelAnalyticsForTenant(tenantId);
  const checkoutStarted =
    funnel.stages.find((s) => s.stage === "checkout_started")?.count ?? 1;

  return REAL_PRODUCT_CATALOG.map((def) => {
    const productOrders = paid.filter((o) => o.productType === def.productType);
    const grossRevenue = productOrders.reduce((s, o) => s + o.amount, 0);
    const partnerCommission = commissions
      .filter((c) => c.productType === def.productType)
      .reduce((s, c) => s + c.commissionAmount, 0);
    const apiCost = (API_COST_BY_LEVEL[def.level] ?? 3) * productOrders.length;
    const paymentPaid =
      funnel.stages.find((s) => s.stage === "payment_paid")?.count ?? 0;
    const conversionPlaceholder =
      def.productType === "free_report"
        ? 0
        : productOrders.length / Math.max(checkoutStarted, 1);

    return {
      productType: def.productType,
      productName: def.titleRu,
      level: def.level,
      price: def.price,
      priceLabel: def.priceLabelRu,
      salesCount: productOrders.length,
      grossRevenue,
      partnerCommission,
      estimatedApiCost: apiCost,
      grossProfitEstimate: grossRevenue - partnerCommission - apiCost,
      conversionRatePlaceholder: Math.round(conversionPlaceholder * 1000) / 10,
    };
  });
}

export function computeCommissionSummary(tenantId: string): CommissionSummary {
  const commissions = getCommissionsForTenant(tenantId);
  const sum = (status: string) =>
    commissions.filter((c) => c.status === status).reduce((s, c) => s + c.commissionAmount, 0);
  return {
    pending: sum("pending"),
    available: sum("available"),
    onHold: sum("on_hold"),
    approved: sum("approved"),
    paid: sum("paid"),
    adjusted: sum("adjusted"),
    cancelled: sum("cancelled"),
  };
}

export function getPartnerDetail(tenantId: string, partnerId: string): PartnerDetail | undefined {
  const partner = getPartnerById(partnerId);
  if (!partner || partner.tenantId !== tenantId) return undefined;

  const orders = getOrdersForTenant(tenantId)
    .filter((o) => o.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  const paid = getOrdersForTenant(tenantId).filter(
    (o) => o.partnerId === partnerId && o.status === "paid" && o.amount > 0
  );

  const productCounts = new Map<string, { label: string; count: number }>();
  const topicCounts = new Map<string, number>();
  for (const o of paid) {
    const cur = productCounts.get(o.productType) ?? { label: o.productTitle, count: 0 };
    cur.count += 1;
    productCounts.set(o.productType, cur);
    if (o.theme) topicCounts.set(o.theme, (topicCounts.get(o.theme) ?? 0) + 1);
  }

  let bestProduct: PartnerDetail["bestProduct"];
  let bestCount = 0;
  for (const [productType, v] of productCounts) {
    if (v.count > bestCount) {
      bestCount = v.count;
      bestProduct = { productType, label: v.label, count: v.count };
    }
  }

  let bestTopic: PartnerDetail["bestTopic"];
  let bestTopicCount = 0;
  for (const [topic, count] of topicCounts) {
    if (count > bestTopicCount) {
      bestTopicCount = count;
      bestTopic = { topic, label: topic, count };
    }
  }

  return {
    ...partner,
    recentOrders: orders,
    commissionSummary: computeCommissionSummary(tenantId),
    bestProduct,
    bestTopic,
  };
}

export function getPartnerLinkSets(tenantId: string, baseUrl?: string): PartnerLinkSet[] {
  return getPartnersForTenant(tenantId).map((p) => {
    const links = buildPartnerLinks(p.slug, baseUrl);
    return {
      partnerId: p.id,
      partnerSlug: p.slug,
      partnerName: p.name,
      general: links.generalFull,
      money: links.moneyFull,
      relationships: links.relationshipsFull,
      personality: links.personalityFull,
    };
  });
}

// In-memory order notes store for mock admin notes
const orderNotesStore = new Map<string, string>();

export function getOrderNotes(orderId: string): string | undefined {
  return orderNotesStore.get(orderId);
}

export function setOrderNotes(orderId: string, notes: string): void {
  orderNotesStore.set(orderId, notes);
}

export function getOrderWithNotes(orderId: string): (Order & { adminNotes?: string }) | undefined {
  const order = getOrderById(orderId);
  if (!order) return undefined;
  const adminNotes = orderNotesStore.get(orderId) ?? order.notes;
  return { ...order, notes: adminNotes, adminNotes };
}
