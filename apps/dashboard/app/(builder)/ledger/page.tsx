"use client";

import { listLedger } from "@astro/api-client";
import { getLedgerEntryLabel } from "@astro/i18n";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useI18n, useT } from "@astro/i18n";
import { FinanceAdminGuard } from "../../../components/ops/FinanceAdminGuard";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDateLocale,
  formatMoneyLocale,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

function LedgerPageContent() {
  const t = useT();
  const { locale } = useI18n();
  const opsLocale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const [partnerFilter, setPartnerFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  const { data, loading, error } = useOpsQuery(
    () =>
      listLedger(tenantId, {
        partnerId: partnerFilter || undefined,
        type: typeFilter || undefined,
      }),
    [tenantId, partnerFilter, typeFilter]
  );

  const rows = (data ?? []).filter((e) => e.type !== "platform_revenue");

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader title={t("dashboard.finance.ledgerTitle")} subtitle={t("dashboard.finance.ledgerSubtitle")} />
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder={t("dashboard.finance.filterPartnerId")}
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder={t("dashboard.finance.filterType")}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>
      <SectionCard title={t("dashboard.finance.ledgerTitle")}>
        <OpsTable
          columns={[
            { key: "date", label: t("dashboard.finance.date") },
            { key: "partner", label: t("dashboard.finance.partner") },
            { key: "type", label: t("dashboard.finance.operationType") },
            { key: "amount", label: t("dashboard.finance.amount") },
            { key: "status", label: t("dashboard.finance.statusColumn") },
            { key: "description", label: t("dashboard.finance.description") },
          ]}
          rows={rows.map((e) => ({
            date: formatDateLocale(e.createdAt, opsLocale),
            partner: e.partnerName ?? e.partnerId ?? "—",
            type: getLedgerEntryLabel(e.type, locale, { audience: "admin" }),
            amount: formatMoneyLocale(e.amount, e.currency, opsLocale),
            status: <OpsStatusBadge status={e.status} category="ledger" />,
            description: e.description,
          }))}
        />
      </SectionCard>
    </div>
  );
}

export default function LedgerPage() {
  return (
    <FinanceAdminGuard>
      <LedgerPageContent />
    </FinanceAdminGuard>
  );
}
