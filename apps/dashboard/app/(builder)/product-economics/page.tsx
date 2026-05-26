"use client";

import { getProductEconomics } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
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

function ProductEconomicsPageContent() {
  const t = useT();
  const locale = useOpsLocale();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const { data, loading, error } = useOpsQuery(
    () => getProductEconomics(tenantId),
    [tenantId]
  );

  if (loading) return <LoadingState message={t("dashboard.finance.loading")} className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title={t("dashboard.finance.productEconomicsTitle")}
        subtitle={t("dashboard.finance.productEconomicsSubtitle")}
      />
      <SectionCard title={t("dashboard.finance.allProducts")}>
        <OpsTable
          columns={[
            { key: "name", label: t("dashboard.finance.product") },
            { key: "type", label: t("dashboard.finance.type") },
            { key: "level", label: t("dashboard.finance.level") },
            { key: "price", label: t("dashboard.finance.price") },
            { key: "sales", label: t("dashboard.finance.salesCount") },
            { key: "revenue", label: t("dashboard.finance.grossRevenue") },
            { key: "commission", label: t("dashboard.finance.partnerCommission") },
            { key: "apiCost", label: t("dashboard.finance.estApiCost") },
            { key: "profit", label: t("dashboard.finance.platformMarginEst") },
            { key: "conversion", label: t("dashboard.finance.conversionPct") },
          ]}
          rows={(data ?? []).map((r) => ({
            name: r.productName,
            type: r.productType,
            level: r.level,
            price: r.priceLabel,
            sales: r.salesCount,
            revenue: formatMoneyLocale(r.grossRevenue, "USD", locale),
            commission: formatMoneyLocale(r.partnerCommission, "USD", locale),
            apiCost: formatMoneyLocale(r.estimatedApiCost, "USD", locale),
            profit: formatMoneyLocale(r.grossProfitEstimate, "USD", locale),
            conversion: `${r.conversionRatePlaceholder}%`,
          }))}
        />
      </SectionCard>
    </div>
  );
}

export default function ProductEconomicsPage() {
  return (
    <FinanceAdminGuard>
      <ProductEconomicsPageContent />
    </FinanceAdminGuard>
  );
}
