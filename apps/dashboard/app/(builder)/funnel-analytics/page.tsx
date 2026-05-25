"use client";

import { getFunnelAnalytics } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  OpsPageHeader,
  OpsTable,
  formatPct,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

type BreakdownTab = "partner" | "product" | "theme" | "visualPack";

export default function FunnelAnalyticsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const [tab, setTab] = useState<BreakdownTab>("partner");

  const { data, loading, error } = useOpsQuery(
    () => getFunnelAnalytics(tenantId),
    [tenantId]
  );

  if (loading) return <LoadingState message="Loading funnel analytics..." className="text-slate-400" />;
  if (error || !data) return <p className="text-red-400">{error ?? "Failed to load"}</p>;

  const breakdownMap = {
    partner: data.byPartner,
    product: data.byProduct,
    theme: data.byTheme,
    visualPack: data.byVisualPack,
  };

  return (
    <div className="space-y-6">
      <OpsPageHeader title="Funnel Analytics" subtitle="Stage counts and conversion (mock seed)" />

      <SectionCard title="Funnel stages">
        <OpsTable
          columns={[
            { key: "stage", label: "Stage" },
            { key: "count", label: "Count" },
            { key: "prev", label: "From previous" },
            { key: "first", label: "From first stage" },
          ]}
          rows={data.stages.map((s) => ({
            stage: s.stage,
            count: s.count.toLocaleString(),
            prev: s.conversionFromPrevious != null ? formatPct(s.conversionFromPrevious) : "—",
            first: formatPct(s.conversionFromFirst),
          }))}
        />
      </SectionCard>

      <SectionCard title="Breakdown">
        <div className="mb-4 flex flex-wrap gap-2">
          {(
            [
              ["partner", "By partner"],
              ["product", "By product"],
              ["theme", "By theme"],
              ["visualPack", "By visual pack"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === key ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {breakdownMap[tab].map((item) => (
          <div key={item.key} className="mb-6">
            <h3 className="mb-2 font-medium text-slate-200">{item.label}</h3>
            <OpsTable
              columns={[
                { key: "stage", label: "Stage" },
                { key: "count", label: "Count" },
                { key: "first", label: "From first" },
              ]}
              rows={item.stages.map((s) => ({
                stage: s.stage,
                count: s.count.toLocaleString(),
                first: formatPct(s.conversionFromFirst),
              }))}
            />
          </div>
        ))}
      </SectionCard>
    </div>
  );
}
