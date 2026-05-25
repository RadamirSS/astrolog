"use client";

import Link from "next/link";
import { getPartner, getPartnerFinance } from "@astro/api-client";
import { LoadingState, SectionCard, StatCard } from "@astro/ui";
import { useParams, useSearchParams } from "next/navigation";
import {
  CopyButton,
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../../hooks/useOpsData";

export default function PartnerDetailPage() {
  const params = useParams<{ partnerId: string }>();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;
  const miniappBase = process.env.NEXT_PUBLIC_MINIAPP_URL;

  const { data: partner, loading, error } = useOpsQuery(
    () => getPartner(tenantId, params.partnerId),
    [tenantId, params.partnerId]
  );
  const { data: finance } = useOpsQuery(
    () => getPartnerFinance(tenantId, params.partnerId),
    [tenantId, params.partnerId]
  );

  if (loading) return <LoadingState message="Loading partner..." className="text-slate-400" />;
  if (error || !partner) return <p className="text-red-400">{error ?? "Partner not found"}</p>;

  const link = (path: string) => (miniappBase ? `${miniappBase.replace(/\/$/, "")}${path}` : path);

  return (
    <div className="space-y-6">
      <OpsPageHeader title={partner.name} subtitle={`@${partner.slug}`} />
      <Link href={`/partners${q}`} className="text-sm text-violet-400 hover:underline">
        ← Back to partners
      </Link>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clicks" value={partner.clicks ?? 0} />
        <StatCard label="Leads" value={partner.leads ?? 0} />
        <StatCard label="Paid orders" value={partner.paidOrders ?? 0} />
        <StatCard label="Revenue" value={formatMoney(partner.revenue ?? 0)} />
        <StatCard label="Commission rate" value={`${Math.round(partner.commissionRate * 100)}%`} />
        <StatCard label="Unpaid commission" value={formatMoney(partner.unpaidCommission ?? 0)} />
        <StatCard
          label="Best product"
          value={partner.bestProduct?.label ?? "—"}
          hint={partner.bestProduct ? `${partner.bestProduct.count} sales` : undefined}
        />
        <StatCard
          label="Best topic"
          value={partner.bestTopic?.label ?? "—"}
          hint={partner.bestTopic ? `${partner.bestTopic.count} orders` : undefined}
        />
      </div>

      <SectionCard title="Overview">
        <div className="flex flex-wrap items-center gap-2">
          <OpsStatusBadge status={partner.status} />
          <span className="text-sm text-slate-400">Visual pack: {partner.defaultVisualPack}</span>
        </div>
      </SectionCard>

      <SectionCard title="Partner links">
        {[
          { label: "General landing", path: `/b/${partner.slug}` },
          { label: "Money topic", path: `/b/${partner.slug}/money` },
          { label: "Relationships topic", path: `/b/${partner.slug}/relationships` },
          { label: "Personality topic", path: `/b/${partner.slug}/personality` },
        ].map(({ label, path }) => (
          <div key={path} className="mb-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="w-40 text-slate-400">{label}</span>
            <code className="text-slate-200">{link(path)}</code>
            <CopyButton value={link(path)} />
          </div>
        ))}
        {!miniappBase && (
          <p className="text-xs text-slate-500">
            Set NEXT_PUBLIC_MINIAPP_URL for full URLs. Relative paths shown above.
          </p>
        )}
      </SectionCard>

      <SectionCard title="Recent orders">
        <OpsTable
          columns={[
            { key: "id", label: "Order" },
            { key: "product", label: "Product" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "date", label: "Date" },
          ]}
          rows={partner.recentOrders.map((o) => ({
            id: (
              <Link href={`/orders/${o.id}${q}`} className="text-violet-400 hover:underline">
                {o.id}
              </Link>
            ),
            product: o.productTitle,
            amount: formatMoney(o.amount, o.currency),
            status: <OpsStatusBadge status={o.status} />,
            date: formatDate(o.createdAt),
          }))}
          emptyMessage="No recent orders"
        />
      </SectionCard>

      <SectionCard title="Finance overview">
        {(finance?.balances ?? []).map((b) => (
          <div key={b.id} className="mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Pending" value={formatMoney(b.pendingBalance, b.currency)} />
            <StatCard label="Available" value={formatMoney(b.availableBalance, b.currency)} />
            <StatCard label="On hold" value={formatMoney(b.onHoldBalance, b.currency)} />
            <StatCard label="Paid out" value={formatMoney(b.paidOutTotal, b.currency)} />
            <StatCard label="Adjusted" value={formatMoney(b.adjustedTotal, b.currency)} />
            <StatCard label="Refunded" value={formatMoney(b.refundedTotal, b.currency)} />
          </div>
        ))}
        {finance?.commissionSummary && (
          <div className="grid gap-3 md:grid-cols-3 mt-4">
            <StatCard label="Pending commissions" value={formatMoney(finance.commissionSummary.pending)} />
            <StatCard label="Available commissions" value={formatMoney(finance.commissionSummary.available)} />
            <StatCard label="Paid commissions" value={formatMoney(finance.commissionSummary.paid)} />
          </div>
        )}
      </SectionCard>

      <SectionCard title="Commission summary">
        <div className="grid gap-3 md:grid-cols-3">
          <StatCard label="Pending" value={formatMoney(partner.commissionSummary.pending)} />
          <StatCard
            label="Available"
            value={formatMoney(
              partner.commissionSummary.available ??
                (partner.commissionSummary as { payable?: number }).payable ??
                0
            )}
          />
          <StatCard label="Paid" value={formatMoney(partner.commissionSummary.paid)} />
        </div>
      </SectionCard>
    </div>
  );
}
