import type { PartnerBalance } from "@astro/api-contracts";
import { MOCK_COMMISSIONS } from "./commissions";
import { MOCK_PAYOUTS } from "./payouts";
import { getPartnerById } from "./partners";

const BASE_TS = "2026-05-01T10:00:00.000Z";

function computeBalance(partnerId: string, tenantId: string): PartnerBalance {
  const commissions = MOCK_COMMISSIONS.filter(
    (c) => c.partnerId === partnerId && c.tenantId === tenantId
  );
  const payouts = MOCK_PAYOUTS.filter(
    (p) => p.partnerId === partnerId && p.tenantId === tenantId && p.status === "paid"
  );
  const partner = getPartnerById(partnerId);

  let pending = 0;
  let available = 0;
  let onHold = 0;
  let cancelled = 0;
  for (const c of commissions) {
    if (c.status === "pending") pending += c.commissionAmount;
    else if (c.status === "available" || c.status === "approved") available += c.commissionAmount;
    else if (c.status === "on_hold") onHold += c.commissionAmount;
    else if (c.status === "cancelled") cancelled += c.commissionAmount;
  }
  const paidOut = payouts.reduce((s, p) => s + p.amount, 0);

  return {
    id: `bal_${partnerId}`,
    tenantId,
    partnerId,
    partnerName: partner?.name,
    currency: "USD",
    pendingBalance: Math.round(pending * 100) / 100,
    availableBalance: Math.round(available * 100) / 100,
    onHoldBalance: Math.round(onHold * 100) / 100,
    paidOutTotal: Math.round(paidOut * 100) / 100,
    adjustedTotal: 0,
    refundedTotal: Math.round(cancelled * 100) / 100,
    createdAt: BASE_TS,
    updatedAt: BASE_TS,
  };
}

export const MOCK_BALANCES: PartnerBalance[] = [
  computeBalance("partner_nicole", "tenant_mystic"),
  computeBalance("partner_luna", "tenant_mystic"),
  computeBalance("partner_mira", "tenant_mystic"),
];

export function getBalancesForTenant(tenantId: string, partnerId?: string): PartnerBalance[] {
  let items = MOCK_BALANCES.filter((b) => b.tenantId === tenantId);
  if (partnerId) items = items.filter((b) => b.partnerId === partnerId);
  return items;
}

export function getBalanceForPartner(
  tenantId: string,
  partnerId: string,
  currency = "USD"
): PartnerBalance | undefined {
  return getBalancesForTenant(tenantId, partnerId).find((b) => b.currency === currency);
}
