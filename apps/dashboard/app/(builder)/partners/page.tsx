"use client";

import Link from "next/link";
import { listPartners } from "@astro/api-client";
import { LoadingState } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PartnersPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;

  const { data, loading, error } = useOpsQuery(() => listPartners(tenantId), [tenantId]);

  if (loading) return <LoadingState message="Loading partners..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const rows = (data ?? []).map((p) => ({
    name: (
      <Link href={`/partners/${p.id}${q}`} className="text-violet-400 hover:underline">
        {p.name}
      </Link>
    ),
    slug: p.slug,
    status: <OpsStatusBadge status={p.status} />,
    rate: `${Math.round(p.commissionRate * 100)}%`,
    clicks: p.clicks ?? 0,
    leads: p.leads ?? 0,
    freeReports: p.freeReports ?? 0,
    paidOrders: p.paidOrders ?? 0,
    revenue: formatMoney(p.revenue ?? 0),
    commission: formatMoney(p.commission ?? 0),
    unpaid: formatMoney(p.unpaidCommission ?? 0),
    action: (
      <Link href={`/partners/${p.id}${q}`} className="text-sm text-violet-400 hover:underline">
        Details
      </Link>
    ),
  }));

  return (
    <div className="space-y-6">
      <OpsPageHeader title="Partners" subtitle="Blogger and affiliate performance" />
      <OpsTable
        columns={[
          { key: "name", label: "Partner" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
          { key: "rate", label: "Commission" },
          { key: "clicks", label: "Clicks" },
          { key: "leads", label: "Leads" },
          { key: "freeReports", label: "Free reports" },
          { key: "paidOrders", label: "Paid orders" },
          { key: "revenue", label: "Revenue" },
          { key: "commission", label: "Commission" },
          { key: "unpaid", label: "Unpaid" },
          { key: "action", label: "Action" },
        ]}
        rows={rows}
      />
    </div>
  );
}
