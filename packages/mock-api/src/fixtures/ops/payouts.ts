import type { Payout } from "@astro/api-contracts";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function periodStart(daysBack: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - daysBack);
  return d.toISOString().slice(0, 10);
}

function periodEnd(daysBack: number): string {
  const d = new Date();
  d.setDate(0);
  d.setMonth(d.getMonth() - daysBack + 1);
  return d.toISOString().slice(0, 10);
}

export const MOCK_PAYOUTS: Payout[] = [
  {
    id: "payout_001",
    tenantId: "tenant_mystic",
    partnerId: "partner_nicole",
    partnerName: "Nicole Astrology",
    currency: "USD",
    periodStart: periodStart(2),
    periodEnd: periodEnd(2),
    amount: 520,
    status: "paid",
    method: "manual",
    createdAt: daysAgo(45),
    approvedAt: daysAgo(42),
    paidAt: daysAgo(40),
    notes: "April payout — bank transfer mock",
  },
  {
    id: "payout_002",
    tenantId: "tenant_mystic",
    partnerId: "partner_luna",
    partnerName: "Luna Guide",
    currency: "USD",
    periodStart: periodStart(2),
    periodEnd: periodEnd(2),
    amount: 280,
    status: "paid",
    method: "manual",
    createdAt: daysAgo(45),
    approvedAt: daysAgo(42),
    paidAt: daysAgo(40),
  },
  {
    id: "payout_003",
    tenantId: "tenant_mystic",
    partnerId: "partner_nicole",
    partnerName: "Nicole Astrology",
    currency: "USD",
    periodStart: periodStart(1),
    periodEnd: periodEnd(1),
    amount: 320,
    status: "approved",
    method: "manual",
    createdAt: daysAgo(10),
    approvedAt: daysAgo(8),
    notes: "May payout — awaiting manual transfer",
  },
  {
    id: "payout_004",
    tenantId: "tenant_mystic",
    partnerId: "partner_luna",
    partnerName: "Luna Guide",
    currency: "USD",
    periodStart: periodStart(1),
    periodEnd: periodEnd(1),
    amount: 180,
    status: "draft",
    method: "manual",
    createdAt: daysAgo(5),
  },
  {
    id: "payout_005",
    tenantId: "tenant_mystic",
    partnerId: "partner_mira",
    partnerName: "Astro Mira",
    currency: "USD",
    periodStart: periodStart(1),
    periodEnd: periodEnd(1),
    amount: 45,
    status: "pending_approval",
    method: "manual",
    createdAt: daysAgo(5),
    notes: "Partner paused — hold for review",
  },
  {
    id: "payout_006",
    tenantId: "tenant_mystic",
    partnerId: "partner_luna",
    partnerName: "Luna Guide",
    currency: "USD",
    periodStart: periodStart(0),
    periodEnd: periodEnd(0),
    amount: 95,
    status: "failed",
    method: "manual",
    createdAt: daysAgo(3),
    approvedAt: daysAgo(2),
    failedAt: daysAgo(1),
    failureReason: "Bank details rejected — manual retry needed",
  },
];

const payoutStore = [...MOCK_PAYOUTS];

export function getPayoutsForTenant(tenantId: string): Payout[] {
  return payoutStore.filter((p) => p.tenantId === tenantId);
}

export function getPayoutById(payoutId: string): Payout | undefined {
  return payoutStore.find((p) => p.id === payoutId);
}

export function createPayoutInStore(input: {
  tenantId: string;
  partnerId: string;
  amount: number;
  currency?: string;
  notes?: string;
}): Payout {
  const partner = input.partnerId;
  const id = `payout_${Date.now()}`;
  const payout: Payout = {
    id,
    tenantId: input.tenantId,
    partnerId: input.partnerId,
    partnerName: undefined,
    currency: input.currency ?? "USD",
    amount: input.amount,
    status: "draft",
    method: "manual",
    createdAt: new Date().toISOString(),
    notes: input.notes,
  };
  payoutStore.push(payout);
  return payout;
}

export function updatePayoutInStore(
  payoutId: string,
  update: { action?: string; status?: Payout["status"]; notes?: string; reason?: string }
): Payout | undefined {
  const idx = payoutStore.findIndex((p) => p.id === payoutId);
  if (idx === -1) return undefined;
  const now = new Date().toISOString();
  const current = payoutStore[idx]!;
  const action = update.action ?? update.status;
  let status = current.status;
  if (action === "approve" || action === "approved") status = "approved";
  else if (action === "paid" || action === "mark_paid") status = "paid";
  else if (action === "failed" || action === "mark_failed") status = "failed";
  else if (action === "cancel" || action === "cancelled") status = "cancelled";
  else if (update.status) status = update.status;

  const next: Payout = {
    ...current,
    status,
    notes: update.notes ?? current.notes,
    failureReason: update.reason ?? current.failureReason,
    approvedAt:
      status === "approved" && !current.approvedAt ? now : current.approvedAt,
    paidAt: status === "paid" && !current.paidAt ? now : current.paidAt,
    failedAt: status === "failed" && !current.failedAt ? now : current.failedAt,
    cancelledAt: status === "cancelled" && !current.cancelledAt ? now : current.cancelledAt,
  };
  payoutStore[idx] = next;
  return next;
}
