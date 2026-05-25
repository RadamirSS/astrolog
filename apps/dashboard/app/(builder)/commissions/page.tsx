"use client";

import Link from "next/link";
import {
  getCommissionSummary,
  holdCommission,
  listCommissions,
  releaseCommission,
} from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function CommissionsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;
  const { isPlatformAdmin: admin } = useAccountRole();

  const { data: commissions, loading, error, reload } = useOpsQuery(
    () => listCommissions(tenantId),
    [tenantId]
  );
  const { data: summary } = useOpsQuery(() => getCommissionSummary(tenantId), [tenantId]);

  if (loading) return <LoadingState message="Loading commissions..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader title="Commissions" subtitle="Partner commission lifecycle with hold period" />

      {summary && (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-7">
          <StatCard label="Pending" value={formatMoney(summary.pending)} />
          <StatCard label="Available" value={formatMoney(summary.available)} />
          <StatCard label="On hold" value={formatMoney(summary.onHold)} />
          <StatCard label="Approved" value={formatMoney(summary.approved)} />
          <StatCard label="Paid" value={formatMoney(summary.paid)} />
          <StatCard label="Adjusted" value={formatMoney(summary.adjusted)} />
          <StatCard label="Cancelled" value={formatMoney(summary.cancelled)} />
        </div>
      )}

      <SectionCard title="Commission records">
        <OpsTable
          columns={[
            { key: "id", label: "ID" },
            { key: "partner", label: "Partner" },
            { key: "order", label: "Order" },
            { key: "product", label: "Product" },
            { key: "gross", label: "Gross" },
            { key: "rate", label: "Rate" },
            { key: "amount", label: "Commission" },
            { key: "status", label: "Status" },
            { key: "hold", label: "Hold until" },
            { key: "available", label: "Available at" },
            { key: "actions", label: "Actions" },
          ]}
          rows={(commissions ?? []).map((c) => ({
            id: c.id,
            partner: (
              <Link href={`/partners/${c.partnerId}${q}`} className="text-violet-400 hover:underline">
                {c.partnerName ?? c.partnerId}
              </Link>
            ),
            order: (
              <Link href={`/orders/${c.orderId}${q}`} className="text-violet-400 hover:underline">
                {c.orderId}
              </Link>
            ),
            product: c.productTitle ?? c.productType,
            gross: formatMoney(c.grossAmount),
            rate: `${Math.round(c.commissionRate * 100)}%`,
            amount: formatMoney(c.commissionAmount),
            status: <OpsStatusBadge status={c.status} />,
            hold: c.holdUntil ? formatDate(c.holdUntil) : "—",
            available: c.availableAt ? formatDate(c.availableAt) : "—",
            actions: admin ? (
              <div className="flex flex-wrap gap-1">
                {(c.status === "pending" || c.status === "on_hold") && (
                  <button
                    type="button"
                    className="rounded bg-violet-700 px-2 py-1 text-xs"
                    onClick={async () => {
                      await releaseCommission(tenantId, c.id);
                      await reload();
                    }}
                  >
                    Release
                  </button>
                )}
                {(c.status === "pending" || c.status === "available") && (
                  <button
                    type="button"
                    className="rounded bg-amber-800 px-2 py-1 text-xs"
                    onClick={async () => {
                      await holdCommission(tenantId, c.id, "Manual hold");
                      await reload();
                    }}
                  >
                    Hold
                  </button>
                )}
              </div>
            ) : (
              "—"
            ),
          }))}
        />
      </SectionCard>
    </div>
  );
}
