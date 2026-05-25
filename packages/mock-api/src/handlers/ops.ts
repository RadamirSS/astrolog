import type {
  CommissionSummary,
  CreatePayoutRequest,
  FunnelAnalyticsSummary,
  LedgerEntry,
  ManualAdjustmentRequest,
  Order,
  OrderListParams,
  Partner,
  PartnerDetail,
  PartnerFinance,
  PartnerLinkSet,
  PartnerBalance,
  Payment,
  Payout,
  ProductEconomicsRow,
  PromoMaterial,
  RevenueSummary,
  UpdatePayoutRequest,
} from "@astro/api-contracts";
import {
  computeCommissionSummary,
  computeProductEconomics,
  computeRevenueSummary,
  filterOrders,
  getBalancesForTenant,
  getBalanceForPartner,
  getCommissionsForTenant,
  getLedgerForTenant,
  getOrderWithNotes,
  getPartnerDetail,
  getPartnerLinkSets,
  getPartnersForTenant,
  getPaymentById,
  getPaymentsForTenant,
  getPayoutById,
  getPayoutsForTenant,
  getPromoMaterialsForTenant,
  setOrderNotes,
  updatePayoutInStore,
  createPayoutInStore,
  getOrdersForTenant,
} from "../fixtures/ops";
import { delay } from "../utils";

export async function mockListOrders(
  tenantId: string,
  params?: OrderListParams
): Promise<Order[]> {
  await delay(150);
  const orders = getOrdersForTenant(tenantId);
  return filterOrders(orders, params).sort((a: Order, b: Order) => b.createdAt.localeCompare(a.createdAt));
}

export async function mockGetOrder(
  tenantId: string,
  orderId: string
): Promise<(Order & { adminNotes?: string }) | null> {
  await delay(100);
  const order = getOrderWithNotes(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  return order;
}

export async function mockSetOrderNotes(
  tenantId: string,
  orderId: string,
  notes: string
): Promise<(Order & { adminNotes?: string }) | null> {
  await delay(100);
  const order = getOrderWithNotes(orderId);
  if (!order || order.tenantId !== tenantId) return null;
  setOrderNotes(orderId, notes);
  return { ...order, notes, adminNotes: notes };
}

export async function mockGetRevenueSummary(tenantId: string): Promise<RevenueSummary> {
  await delay(150);
  return computeRevenueSummary(tenantId);
}

export async function mockListPartners(tenantId: string): Promise<Partner[]> {
  await delay(120);
  return getPartnersForTenant(tenantId);
}

export async function mockGetPartner(
  tenantId: string,
  partnerId: string
): Promise<PartnerDetail | null> {
  await delay(120);
  return getPartnerDetail(tenantId, partnerId) ?? null;
}

export async function mockGetPartnerLinkSets(
  tenantId: string,
  baseUrl?: string
): Promise<PartnerLinkSet[]> {
  await delay(80);
  return getPartnerLinkSets(tenantId, baseUrl);
}

export async function mockListCommissions(tenantId: string) {
  await delay(120);
  return getCommissionsForTenant(tenantId);
}

export async function mockGetCommissionSummary(tenantId: string): Promise<CommissionSummary> {
  await delay(80);
  return computeCommissionSummary(tenantId);
}

export async function mockListPayouts(tenantId: string): Promise<Payout[]> {
  await delay(120);
  return getPayoutsForTenant(tenantId);
}

export async function mockUpdatePayout(
  tenantId: string,
  payoutId: string,
  update: UpdatePayoutRequest
): Promise<Payout | null> {
  await delay(150);
  const existing = getPayoutById(payoutId);
  if (!existing || existing.tenantId !== tenantId) return null;
  return updatePayoutInStore(payoutId, update) ?? null;
}

export async function mockListPromoMaterials(
  tenantId: string,
  partnerId?: string
): Promise<PromoMaterial[]> {
  await delay(100);
  return getPromoMaterialsForTenant(tenantId, partnerId);
}

export async function mockGetProductEconomics(tenantId: string): Promise<ProductEconomicsRow[]> {
  await delay(120);
  return computeProductEconomics(tenantId);
}

export async function mockGetFunnelAnalytics(tenantId: string): Promise<FunnelAnalyticsSummary> {
  await delay(120);
  const { getFunnelAnalyticsForTenant } = await import("../fixtures/ops/funnel-analytics");
  return getFunnelAnalyticsForTenant(tenantId);
}

export async function mockListPayments(tenantId: string, partnerId?: string): Promise<Payment[]> {
  await delay(120);
  return getPaymentsForTenant(tenantId, partnerId);
}

export async function mockGetPayment(tenantId: string, paymentId: string): Promise<Payment | null> {
  await delay(100);
  const payment = getPaymentById(paymentId);
  if (!payment || payment.tenantId !== tenantId) return null;
  return payment;
}

export async function mockListBalances(
  tenantId: string,
  partnerId?: string
): Promise<PartnerBalance[]> {
  await delay(100);
  return getBalancesForTenant(tenantId, partnerId);
}

export async function mockGetPartnerBalance(
  tenantId: string,
  partnerId: string,
  currency = "USD"
): Promise<PartnerBalance | null> {
  await delay(100);
  return getBalanceForPartner(tenantId, partnerId, currency) ?? null;
}

export async function mockListLedger(
  tenantId: string,
  filters?: {
    partnerId?: string;
    type?: string;
    currency?: string;
    orderId?: string;
    paymentId?: string;
    payoutId?: string;
  }
): Promise<LedgerEntry[]> {
  await delay(120);
  return getLedgerForTenant(tenantId, filters);
}

export async function mockCreatePayout(
  tenantId: string,
  input: CreatePayoutRequest
): Promise<Payout> {
  await delay(150);
  return createPayoutInStore({ ...input, tenantId });
}

export async function mockGetPartnerFinance(
  tenantId: string,
  partnerId: string
): Promise<PartnerFinance | null> {
  await delay(120);
  const partner = getPartnerDetail(tenantId, partnerId);
  if (!partner) return null;
  return {
    partnerId,
    balances: getBalancesForTenant(tenantId, partnerId),
    commissionSummary: computeCommissionSummary(tenantId),
    recentCommissions: getCommissionsForTenant(tenantId)
      .filter((c) => c.partnerId === partnerId)
      .slice(0, 10),
    recentPayouts: getPayoutsForTenant(tenantId)
      .filter((p) => p.partnerId === partnerId)
      .slice(0, 10),
  };
}

export async function mockReleaseCommission(
  tenantId: string,
  commissionId: string
): Promise<import("@astro/api-contracts").Commission | null> {
  await delay(100);
  const commissions = getCommissionsForTenant(tenantId);
  const idx = commissions.findIndex((c) => c.id === commissionId);
  if (idx === -1) return null;
  const c = commissions[idx]!;
  if (c.status !== "pending" && c.status !== "on_hold") return c;
  commissions[idx] = {
    ...c,
    status: "available",
    availableAt: new Date().toISOString(),
  };
  return commissions[idx]!;
}

export async function mockHoldCommission(
  tenantId: string,
  commissionId: string,
  reason: string
): Promise<import("@astro/api-contracts").Commission | null> {
  await delay(100);
  const commissions = getCommissionsForTenant(tenantId);
  const idx = commissions.findIndex((c) => c.id === commissionId);
  if (idx === -1) return null;
  const c = commissions[idx]!;
  commissions[idx] = { ...c, status: "on_hold", adjustmentReason: reason };
  return commissions[idx]!;
}

export { resolvePartnerBySlug } from "../fixtures/ops";
