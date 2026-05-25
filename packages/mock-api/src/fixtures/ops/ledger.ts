import type { LedgerEntry } from "@astro/api-contracts";
import { MOCK_COMMISSIONS } from "./commissions";
import { MOCK_PAYMENTS } from "./payments";
import { MOCK_PAYOUTS } from "./payouts";

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const entries: LedgerEntry[] = [];

let seq = 1;
function add(entry: Omit<LedgerEntry, "id" | "createdAt"> & { createdAt?: string }) {
  entries.push({
    id: `led_${String(seq++).padStart(3, "0")}`,
    createdAt: entry.createdAt ?? daysAgo(seq % 30),
    ...entry,
  });
}

for (const payment of MOCK_PAYMENTS.filter((p) => p.status === "paid")) {
  add({
    tenantId: payment.tenantId,
    partnerId: payment.partnerId,
    orderId: payment.orderId,
    paymentId: payment.id,
    type: "payment_received",
    direction: "credit",
    amount: payment.amount,
    currency: payment.currency,
    status: "posted",
    description: `Payment received for order ${payment.orderId}`,
  });
  if (payment.providerFee) {
    add({
      tenantId: payment.tenantId,
      orderId: payment.orderId,
      paymentId: payment.id,
      type: "provider_fee",
      direction: "debit",
      amount: payment.providerFee,
      currency: payment.currency,
      status: "posted",
      description: `Provider fee for order ${payment.orderId}`,
    });
  }
}

for (const commission of MOCK_COMMISSIONS.filter((c) => c.commissionAmount > 0)) {
  add({
    tenantId: commission.tenantId,
    partnerId: commission.partnerId,
    orderId: commission.orderId,
    commissionId: commission.id,
    type:
      commission.status === "available" || commission.status === "approved"
        ? "partner_commission_available"
        : commission.status === "cancelled"
          ? "partner_commission_cancelled"
          : "partner_commission_pending",
    direction: commission.status === "cancelled" ? "debit" : "credit",
    amount: commission.commissionAmount,
    currency: commission.currency ?? "USD",
    status: "posted",
    description: `Commission ${commission.status} for order ${commission.orderId}`,
  });
}

for (const payout of MOCK_PAYOUTS) {
  add({
    tenantId: payout.tenantId,
    partnerId: payout.partnerId,
    payoutId: payout.id,
    type: "payout_created",
    direction: "debit",
    amount: payout.amount,
    currency: payout.currency ?? "USD",
    status: "posted",
    description: `Payout draft ${payout.id}`,
  });
  if (payout.status === "approved" || payout.status === "paid" || payout.status === "failed") {
    add({
      tenantId: payout.tenantId,
      partnerId: payout.partnerId,
      payoutId: payout.id,
      type: "payout_approved",
      direction: "debit",
      amount: payout.amount,
      currency: payout.currency ?? "USD",
      status: "posted",
      description: `Payout approved ${payout.id}`,
    });
  }
  if (payout.status === "paid") {
    add({
      tenantId: payout.tenantId,
      partnerId: payout.partnerId,
      payoutId: payout.id,
      type: "payout_paid",
      direction: "debit",
      amount: payout.amount,
      currency: payout.currency ?? "USD",
      status: "posted",
      description: `Payout paid ${payout.id}`,
    });
  }
  if (payout.status === "failed") {
    add({
      tenantId: payout.tenantId,
      partnerId: payout.partnerId,
      payoutId: payout.id,
      type: "payout_failed",
      direction: "credit",
      amount: payout.amount,
      currency: payout.currency ?? "USD",
      status: "posted",
      description: `Payout failed ${payout.id}`,
    });
  }
}

export const MOCK_LEDGER: LedgerEntry[] = entries;

export function getLedgerForTenant(
  tenantId: string,
  filters?: {
    partnerId?: string;
    type?: string;
    currency?: string;
    orderId?: string;
    paymentId?: string;
    payoutId?: string;
  }
): LedgerEntry[] {
  return MOCK_LEDGER.filter((e) => {
    if (e.tenantId !== tenantId) return false;
    if (filters?.partnerId && e.partnerId !== filters.partnerId) return false;
    if (filters?.type && e.type !== filters.type) return false;
    if (filters?.currency && e.currency !== filters.currency) return false;
    if (filters?.orderId && e.orderId !== filters.orderId) return false;
    if (filters?.paymentId && e.paymentId !== filters.paymentId) return false;
    if (filters?.payoutId && e.payoutId !== filters.payoutId) return false;
    return true;
  }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
