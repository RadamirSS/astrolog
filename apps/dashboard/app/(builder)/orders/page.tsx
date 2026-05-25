"use client";

import Link from "next/link";
import { listOrders } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

type OrderFilters = {
  status?: string;
  productType?: string;
  partnerId?: string;
};

export default function OrdersPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;

  const [status, setStatus] = useState<string>("");
  const [productType, setProductType] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");

  const params = useMemo((): OrderFilters | undefined => {
    const p: OrderFilters = {};
    if (status) p.status = status;
    if (productType) p.productType = productType;
    if (partnerId) p.partnerId = partnerId;
    return Object.keys(p).length ? p : undefined;
  }, [status, productType, partnerId]);

  const { data: orders, loading, error } = useOpsQuery(
    () =>
      listOrders(tenantId, params as Parameters<typeof listOrders>[1]),
    [tenantId, status, productType, partnerId]
  );

  if (loading) return <LoadingState message="Loading orders..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  const rows = (orders ?? []).map((o) => ({
    id: (
      <Link href={`/orders/${o.id}${q}`} className="text-violet-400 hover:underline">
        {o.id}
      </Link>
    ),
    date: formatDate(o.createdAt),
    user: o.userId ?? o.sessionId ?? "—",
    product: o.productTitle,
    theme: o.theme ?? "—",
    partner: o.partnerSlug ?? "Direct",
    amount: formatMoney(o.amount, o.currency),
    payment: <OpsStatusBadge status={o.paymentStatus} />,
    report: <OpsStatusBadge status={o.reportStatus} />,
    entitlement: o.entitlementStatus ? (
      <OpsStatusBadge status={o.entitlementStatus} />
    ) : (
      "—"
    ),
    action: (
      <Link href={`/orders/${o.id}${q}`} className="text-sm text-violet-400 hover:underline">
        Details
      </Link>
    ),
  }));

  return (
    <div className="space-y-6">
      <OpsPageHeader title="Orders" subtitle="Operational order list (mock data)" />

      <SectionCard title="Filters">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {["created", "payment_pending", "paid", "failed", "cancelled", "refunded", "expired"].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All products</option>
            <option value="low_ticket_money">Денежный код</option>
            <option value="low_ticket_relationships">Код отношений</option>
            <option value="low_ticket_personality">Личностный портрет</option>
            <option value="bundle_all_topics">Bundle</option>
            <option value="main_natal_portrait">Полный портрет</option>
            <option value="premium_consultation">Premium</option>
          </select>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All partners</option>
            <option value="partner_nicole">nicole</option>
            <option value="partner_luna">luna-guide</option>
            <option value="partner_mira">astro-mira</option>
          </select>
        </div>
      </SectionCard>

      <OpsTable
        columns={[
          { key: "id", label: "Order ID" },
          { key: "date", label: "Date" },
          { key: "user", label: "User/session" },
          { key: "product", label: "Product" },
          { key: "theme", label: "Theme" },
          { key: "partner", label: "Partner" },
          { key: "amount", label: "Amount" },
          { key: "payment", label: "Payment" },
          { key: "report", label: "Report" },
          { key: "entitlement", label: "Entitlement" },
          { key: "action", label: "Action" },
        ]}
        rows={rows}
        emptyMessage="No orders match filters"
      />
    </div>
  );
}
