"use client";

import { getRevenueSummary } from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useT } from "@astro/i18n";
import { FinanceAdminGuard } from "../../../components/ops/FinanceAdminGuard";
import {
  OpsPageHeader,
  OpsTable,
  formatMoneyLocale,
  useOpsLocale,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

function RevenuePageContent() {
  const t = useT();
  const locale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const { data, loading, error } = useOpsQuery(
    () => getRevenueSummary(tenantId),
    [tenantId]
  );

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error || !data) return <p className="text-red-400">{error ?? t("dashboard.finance.noData")}</p>;

  const breakdownTable = (items: typeof data.byProduct, title: string) => (
    <SectionCard title={title}>
      <OpsTable
        columns={[
          { key: "label", label: t("dashboard.finance.name") },
          { key: "orders", label: t("dashboard.finance.revenuePaidOrders") },
          { key: "revenue", label: t("dashboard.finance.grossRevenue") },
        ]}
        rows={items.map((i) => ({
          label: i.label,
          orders: i.orderCount,
          revenue: formatMoneyLocale(i.revenue, "USD", locale),
        }))}
      />
    </SectionCard>
  );

  return (
    <div className="space-y-6">
      <OpsPageHeader title={t("dashboard.finance.revenueTitle")} subtitle={t("dashboard.finance.revenueSubtitle")} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={t("dashboard.finance.revenueToday")} value={formatMoneyLocale(data.revenueToday, "USD", locale)} />
        <StatCard
          label={t("dashboard.finance.revenue7d")}
          value={formatMoneyLocale(data.revenueLast7Days, "USD", locale)}
        />
        <StatCard
          label={t("dashboard.finance.revenue30d")}
          value={formatMoneyLocale(data.revenueLast30Days, "USD", locale)}
        />
        <StatCard label={t("dashboard.finance.revenuePaidOrders")} value={data.paidOrdersCount} />
        <StatCard
          label={t("dashboard.finance.revenueAvgOrder")}
          value={formatMoneyLocale(data.averageOrderValue, "USD", locale)}
        />
        <StatCard
          label={t("dashboard.finance.refunds")}
          value={formatMoneyLocale(data.refundsAmount, "USD", locale)}
          hint={`${data.refundsCount}`}
        />
      </div>

      {breakdownTable(data.byProduct, t("dashboard.finance.revenueByProduct"))}
      {breakdownTable(data.byTheme, t("dashboard.finance.revenueByTheme"))}
      {breakdownTable(data.byPartner, t("dashboard.finance.revenueByPartner"))}
    </div>
  );
}

export default function RevenuePage() {
  return (
    <FinanceAdminGuard>
      <RevenuePageContent />
    </FinanceAdminGuard>
  );
}
