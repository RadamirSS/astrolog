"use client";

import { listPromoMaterials } from "@astro/api-client";
import { Badge, LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { CopyButton, OpsPageHeader } from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PromoMaterialsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const [partnerFilter, setPartnerFilter] = useState("");

  const { data, loading, error } = useOpsQuery(
    () => listPromoMaterials(tenantId, partnerFilter || undefined),
    [tenantId, partnerFilter]
  );

  if (loading) return <LoadingState message="Loading promo materials..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Promo Materials"
        subtitle="Ready-to-copy story, post, CTA, and link text"
      />

      <select
        value={partnerFilter}
        onChange={(e) => setPartnerFilter(e.target.value)}
        className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      >
        <option value="">All partners</option>
        <option value="partner_nicole">Nicole Astrology</option>
        <option value="partner_luna">Luna Guide</option>
        <option value="partner_mira">Astro Mira</option>
      </select>

      {(data ?? []).map((m) => (
        <SectionCard key={m.id} title={m.title}>
          <div className="mb-3 flex flex-wrap gap-2">
            <Badge variant="info">{m.type}</Badge>
            <Badge variant="info">{m.visualPack}</Badge>
            {m.partnerSlug && <Badge variant="info">@{m.partnerSlug}</Badge>}
          </div>
          <pre className="whitespace-pre-wrap rounded-lg bg-slate-900 p-4 text-sm text-slate-200">
            {m.body}
          </pre>
          {m.url && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <code>{m.url}</code>
              <CopyButton value={m.body} label="Copy text" />
              <CopyButton value={m.url} label="Copy link" />
            </div>
          )}
        </SectionCard>
      ))}
    </div>
  );
}
