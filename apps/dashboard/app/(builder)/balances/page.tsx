"use client";

import Link from "next/link";
import { listBalances } from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsTable,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function BalancesPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;

  const { data, loading, error } = useOpsQuery(() => listBalances(tenantId), [tenantId]);

  if (loading) return <LoadingState message="Loading balances..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const rows = data ?? [];
  const totalAvailable = rows.reduce((s, b) => s + b.availableBalance, 0);
  const totalPending = rows.reduce((s, b) => s + b.pendingBalance, 0);

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Balances"
        subtitle="Partner balance buckets derived from ledger and commission state"
      />
      <div className="grid gap-4 md:grid-cols-2">
        <StatCard label="Total pending" value={formatMoney(totalPending)} />
        <StatCard label="Total available" value={formatMoney(totalAvailable)} />
      </div>
      <SectionCard title="Partner balances">
        <OpsTable
          columns={[
            { key: "partner", label: "Partner" },
            { key: "currency", label: "Currency" },
            { key: "pending", label: "Pending" },
            { key: "available", label: "Available" },
            { key: "onHold", label: "On hold" },
            { key: "paidOut", label: "Paid out" },
            { key: "adjusted", label: "Adjusted" },
            { key: "refunded", label: "Refunded" },
            { key: "action", label: "Detail" },
          ]}
          rows={rows.map((b) => ({
            partner: b.partnerName ?? b.partnerId,
            currency: b.currency,
            pending: formatMoney(b.pendingBalance, b.currency),
            available: formatMoney(b.availableBalance, b.currency),
            onHold: formatMoney(b.onHoldBalance, b.currency),
            paidOut: formatMoney(b.paidOutTotal, b.currency),
            adjusted: formatMoney(b.adjustedTotal, b.currency),
            refunded: formatMoney(b.refundedTotal, b.currency),
            action: (
              <Link
                href={`/partners/${b.partnerId}${q}`}
                className="text-violet-400 hover:underline text-sm"
              >
                Open partner
              </Link>
            ),
          }))}
        />
      </SectionCard>
    </div>
  );
}
