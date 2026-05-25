"use client";

import { listLedger } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function LedgerPage() {
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

  if (loading) return <LoadingState message="Loading ledger..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Ledger"
        subtitle="Append-only financial truth — read-only audit trail"
      />
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter partner ID..."
          value={partnerFilter}
          onChange={(e) => setPartnerFilter(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
        <input
          type="text"
          placeholder="Filter type..."
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        />
      </div>
      <SectionCard title="Ledger entries">
        <OpsTable
          columns={[
            { key: "id", label: "ID" },
            { key: "date", label: "Date" },
            { key: "partner", label: "Partner" },
            { key: "refs", label: "Refs" },
            { key: "type", label: "Type" },
            { key: "direction", label: "Dir" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "description", label: "Description" },
          ]}
          rows={(data ?? []).map((e) => ({
            id: e.id,
            date: formatDate(e.createdAt),
            partner: e.partnerName ?? e.partnerId ?? "—",
            refs: [e.orderId, e.paymentId, e.payoutId].filter(Boolean).join(" / ") || "—",
            type: e.type,
            direction: e.direction,
            amount: formatMoney(e.amount, e.currency),
            status: <OpsStatusBadge status={e.status} />,
            description: e.description,
          }))}
        />
      </SectionCard>
    </div>
  );
}
