"use client";

import { getPartnerLinkSets } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { CopyButton, OpsPageHeader } from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PartnerLinksPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const miniappBase = process.env.NEXT_PUBLIC_MINIAPP_URL;

  const { data, loading, error } = useOpsQuery(
    () => getPartnerLinkSets(tenantId, miniappBase),
    [tenantId, miniappBase]
  );

  if (loading) return <LoadingState message="Loading partner links..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Partner Links"
        subtitle="Copyable attribution links for bloggers"
      />
      {!miniappBase && (
        <p className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-2 text-sm text-amber-200">
          NEXT_PUBLIC_MINIAPP_URL is not set — showing relative paths. Add the env var for full URLs.
        </p>
      )}

      {(data ?? []).map((set) => (
        <SectionCard key={set.partnerId} title={set.partnerName}>
          {[
            { label: "General landing", url: set.general },
            { label: "Money topic", url: set.money },
            { label: "Relationships topic", url: set.relationships },
            { label: "Personality topic", url: set.personality },
          ].map(({ label, url }) => (
            <div key={label} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="w-44 shrink-0 text-slate-400">{label}</span>
              <code className="break-all text-slate-200">{url}</code>
              <CopyButton value={url} />
            </div>
          ))}
        </SectionCard>
      ))}
    </div>
  );
}
