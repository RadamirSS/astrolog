import type { AppLocale } from "./core";
import { enDictionary, ruDictionary } from "./dictionaries";
import { t, type Dictionary } from "./core";

export type FinanceStatusCategory =
  | "payment"
  | "commission"
  | "payout"
  | "entitlement"
  | "report"
  | "order"
  | "ledger"
  | "generic";

const DICTS: Record<AppLocale, Dictionary> = { en: enDictionary, ru: ruDictionary };

/** Map raw API enum to i18n key suffix under dashboard.finance.status.{category} */
const STATUS_KEY_MAP: Record<string, { category: FinanceStatusCategory; key: string }> = {
  created: { category: "payment", key: "created" },
  pending: { category: "commission", key: "pending" },
  payment_pending: { category: "order", key: "payment_pending" },
  paid: { category: "payment", key: "paid" },
  failed: { category: "payment", key: "failed" },
  cancelled: { category: "payment", key: "cancelled" },
  expired: { category: "payment", key: "expired" },
  refunded: { category: "payment", key: "refunded" },
  partially_refunded: { category: "payment", key: "partially_refunded" },
  chargeback: { category: "payment", key: "chargeback" },
  available: { category: "commission", key: "available" },
  on_hold: { category: "commission", key: "on_hold" },
  approved: { category: "commission", key: "approved" },
  adjusted: { category: "commission", key: "adjusted" },
  draft: { category: "payout", key: "draft" },
  pending_approval: { category: "payout", key: "pending_approval" },
  processing: { category: "payout", key: "processing" },
  locked: { category: "entitlement", key: "locked" },
  pending_payment: { category: "entitlement", key: "pending_payment" },
  paid_generating: { category: "entitlement", key: "paid_generating" },
  ready: { category: "entitlement", key: "ready" },
  revoked: { category: "entitlement", key: "revoked" },
  generating: { category: "report", key: "generating" },
  queued: { category: "report", key: "queued" },
  paid_pending: { category: "report", key: "paid_pending" },
  posted: { category: "ledger", key: "posted" },
  voided: { category: "ledger", key: "voided" },
  reversed: { category: "ledger", key: "reversed" },
};

export type LedgerEntryAudience = "creator" | "admin";

export function getFinanceStatusLabel(
  status: string,
  locale: AppLocale,
  categoryHint?: FinanceStatusCategory
): string {
  const dict = DICTS[locale] ?? DICTS.en;
  const mapped = STATUS_KEY_MAP[status];
  const category = categoryHint ?? mapped?.category ?? "generic";
  const keySuffix = mapped?.key ?? status;
  const path = `dashboard.finance.statusLabels.${category}.${keySuffix}`;
  const label = t(dict, path);
  if (label !== path) return label;
  const generic = t(dict, `dashboard.finance.statusLabels.generic.${keySuffix}`);
  if (generic !== `dashboard.finance.statusLabels.generic.${keySuffix}`) return generic;
  return status.replace(/_/g, " ");
}

/** Human-readable ledger operation type (creator-friendly by default; admin uses PART 8 labels). */
export function getLedgerEntryLabel(
  type: string,
  locale: AppLocale,
  options?: { audience?: LedgerEntryAudience }
): string {
  const dict = DICTS[locale] ?? DICTS.en;
  const audience = options?.audience ?? "creator";
  if (audience === "admin") {
    const adminPath = `dashboard.finance.ledgerTypesAdmin.${type}`;
    const adminLabel = t(dict, adminPath);
    if (adminLabel !== adminPath) return adminLabel;
  }
  const path = `dashboard.finance.ledgerTypes.${type}`;
  const label = t(dict, path);
  if (label !== path) return label;
  return type.replace(/_/g, " ");
}

export function getPayoutMethodLabel(method: string | undefined | null, locale: AppLocale): string {
  if (!method) return "—";
  const dict = DICTS[locale] ?? DICTS.en;
  const path = `dashboard.finance.payoutMethods.${method}`;
  const label = t(dict, path);
  if (label !== path) return label;
  return method;
}

export function getFinanceStatusVariant(status: string): "success" | "warning" | "error" | "info" | "neutral" {
  if (["paid", "ready", "active", "approved", "webhook_configured", "connected"].includes(status)) {
    return "success";
  }
  if (
    [
      "pending",
      "payment_pending",
      "generating",
      "queued",
      "pending_approval",
      "processing",
      "paid_generating",
      "paid_pending",
      "draft",
    ].includes(status)
  ) {
    return "warning";
  }
  if (["failed", "cancelled", "blocked", "refunded", "revoked", "error", "chargeback"].includes(status)) {
    return "error";
  }
  if (["on_hold", "locked", "expired", "voided"].includes(status)) {
    return "info";
  }
  if (["posted", "reversed"].includes(status)) {
    return "neutral";
  }
  return "neutral";
}
