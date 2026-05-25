"use client";

import Link from "next/link";
import { listPremiumRequestsForTenant, type PremiumRequestStatus } from "@astro/api-client";
import { EmptyState, ErrorState, LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
} from "../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PremiumRequestsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;

  const [status, setStatus] = useState("");
  const [topic, setTopic] = useState("");

  const filters = useMemo(() => {
    const p: { status?: PremiumRequestStatus; topic?: string } = {};
    if (status) p.status = status as PremiumRequestStatus;
    if (topic) p.topic = topic;
    return Object.keys(p).length ? p : undefined;
  }, [status, topic]);

  const { data: requests, loading, error } = useOpsQuery(
    () => listPremiumRequestsForTenant(tenantId, filters),
    [tenantId, status, topic]
  );

  if (loading) return <LoadingState message="Loading premium requests..." className="text-slate-400" />;
  if (error) {
    return (
      <ErrorState title={error} retryLabel="Retry" />
    );
  }

  const rows = (requests ?? []).map((r) => ({
    id: (
      <Link href={`/premium-requests/${r.id}${q}`} className="text-violet-400 hover:underline">
        {r.id}
      </Link>
    ),
    date: formatDate(r.createdAt),
    user: r.userId ?? r.sessionId ?? "—",
    topic: r.topic,
    product: r.productTitle,
    status: <OpsStatusBadge status={r.status} />,
    payment: r.paymentStatus ? <OpsStatusBadge status={r.paymentStatus} /> : "—",
    expert: r.assignedExpert ?? "—",
    action: (
      <Link href={`/premium-requests/${r.id}${q}`} className="text-sm text-violet-400 hover:underline">
        Details
      </Link>
    ),
  }));

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Premium requests"
        subtitle="Manual Premium consultation queue (pilot)"
      />

      <SectionCard title="Filters">
        <div className="flex flex-wrap gap-3">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {[
              "submitted",
              "payment_pending",
              "paid",
              "in_review",
              "scheduled",
              "completed",
              "cancelled",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          >
            <option value="">All topics</option>
            {["money", "relationships", "personality", "full_portrait", "other"].map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </SectionCard>

      {rows.length === 0 ? (
        <EmptyState
          title="No premium requests yet"
          description="Premium consultation requests from the miniapp will appear here."
        />
      ) : (
        <OpsTable
          columns={[
            { key: "id", label: "ID" },
            { key: "date", label: "Date" },
            { key: "user", label: "User" },
            { key: "topic", label: "Topic" },
            { key: "product", label: "Product" },
            { key: "status", label: "Status" },
            { key: "payment", label: "Payment" },
            { key: "expert", label: "Expert" },
            { key: "action", label: "" },
          ]}
          rows={rows}
        />
      )}
    </div>
  );
}
