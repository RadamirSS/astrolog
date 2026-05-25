"use client";

import { getProductEconomics } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsTable,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function ProductEconomicsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";

  const { data, loading, error } = useOpsQuery(
    () => getProductEconomics(tenantId),
    [tenantId]
  );

  if (loading) return <LoadingState message="Loading product economics..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Product Economics"
        subtitle="Gross revenue, partner commissions, and platform margin estimate (not net profit)"
      />
      <SectionCard title="All products">
        <OpsTable
          columns={[
            { key: "name", label: "Product" },
            { key: "type", label: "Type" },
            { key: "level", label: "Level" },
            { key: "price", label: "Price" },
            { key: "sales", label: "Sales" },
            { key: "revenue", label: "Gross revenue" },
            { key: "commission", label: "Partner commission" },
            { key: "apiCost", label: "Est. API cost" },
            { key: "profit", label: "Platform margin est." },
            { key: "conversion", label: "Conversion %" },
          ]}
          rows={(data ?? []).map((r) => ({
            name: r.productName,
            type: r.productType,
            level: r.level,
            price: r.priceLabel,
            sales: r.salesCount,
            revenue: formatMoney(r.grossRevenue),
            commission: formatMoney(r.partnerCommission),
            apiCost: formatMoney(r.estimatedApiCost),
            profit: formatMoney(r.grossProfitEstimate),
            conversion: `${r.conversionRatePlaceholder}%`,
          }))}
        />
      </SectionCard>
    </div>
  );
}
