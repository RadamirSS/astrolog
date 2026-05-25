"use client";

import { getRevenueSummary } from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsTable,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function RevenuePage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const { data, loading, error } = useOpsQuery(
    () => getRevenueSummary(tenantId),
    [tenantId]
  );

  if (loading) return <LoadingState message="Loading revenue..." className="text-slate-400" />;
  if (error || !data) return <p className="text-red-400">{error ?? "Failed to load"}</p>;

  const breakdownTable = (items: typeof data.byProduct, title: string) => (
    <SectionCard title={title}>
      <OpsTable
        columns={[
          { key: "label", label: "Name" },
          { key: "orders", label: "Paid orders" },
          { key: "revenue", label: "Revenue" },
        ]}
        rows={items.map((i) => ({
          label: i.label,
          orders: i.orderCount,
          revenue: formatMoney(i.revenue),
        }))}
      />
    </SectionCard>
  );

  return (
    <div className="space-y-6">
      <OpsPageHeader title="Revenue" subtitle="Summary from mock paid orders" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Today" value={formatMoney(data.revenueToday)} />
        <StatCard label="Last 7 days" value={formatMoney(data.revenueLast7Days)} />
        <StatCard label="Last 30 days" value={formatMoney(data.revenueLast30Days)} />
        <StatCard label="Paid orders" value={data.paidOrdersCount} />
        <StatCard label="Average order value" value={formatMoney(data.averageOrderValue)} />
        <StatCard
          label="Refunds"
          value={formatMoney(data.refundsAmount)}
          hint={`${data.refundsCount} orders`}
        />
      </div>

      {breakdownTable(data.byProduct, "Revenue by product")}
      {breakdownTable(data.byTheme, "Revenue by theme")}
      {breakdownTable(data.byPartner, "Revenue by partner")}
    </div>
  );
}
