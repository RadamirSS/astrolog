"use client";

import Link from "next/link";
import { listPayments } from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PaymentsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;

  const { data, loading, error } = useOpsQuery(() => listPayments(tenantId), [tenantId]);

  if (loading) return <LoadingState message="Loading payments..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Payments"
        subtitle="Platform payment records — no real provider integration in closed pilot"
      />
      <SectionCard title="Payment records">
        <OpsTable
          columns={[
            { key: "id", label: "Payment ID" },
            { key: "order", label: "Order" },
            { key: "date", label: "Date" },
            { key: "partner", label: "Partner" },
            { key: "product", label: "Product" },
            { key: "amount", label: "Amount" },
            { key: "provider", label: "Provider" },
            { key: "status", label: "Status" },
            { key: "fee", label: "Provider fee" },
            { key: "confirmed", label: "Confirmed" },
          ]}
          rows={(data ?? []).map((p) => ({
            id: p.id,
            order: (
              <Link href={`/orders/${p.orderId}${q}`} className="text-violet-400 hover:underline">
                {p.orderId}
              </Link>
            ),
            date: formatDate(p.createdAt),
            partner: p.partnerName ?? p.partnerId ?? "—",
            product: p.productTitle ?? "—",
            amount: formatMoney(p.amount, p.currency),
            provider: p.provider,
            status: <OpsStatusBadge status={p.status} />,
            fee: p.providerFee != null ? formatMoney(p.providerFee, p.currency) : "—",
            confirmed: p.confirmedAt ? formatDate(p.confirmedAt) : "—",
          }))}
        />
      </SectionCard>
    </div>
  );
}
