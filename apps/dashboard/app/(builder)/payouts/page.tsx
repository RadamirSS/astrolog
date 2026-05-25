"use client";

import {
  createPayout,
  listPartners,
  listPayouts,
  updatePayout,
} from "@astro/api-client";
import { LoadingState, SectionCard } from "@astro/ui";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  OpsPageHeader,
  OpsStatusBadge,
  OpsTable,
  formatDate,
  formatMoney,
} from "../../../components/ops/OpsShared";
import { useAccountRole } from "../../../hooks/useAccountRole";
import { useOpsQuery } from "../../../hooks/useOpsData";

export default function PayoutsPage() {
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const { isPlatformAdmin: admin } = useAccountRole();

  const { data, loading, error, reload } = useOpsQuery(
    () => listPayouts(tenantId),
    [tenantId]
  );
  const { data: partners } = useOpsQuery(() => listPartners(tenantId), [tenantId]);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [draftPartnerId, setDraftPartnerId] = useState("");
  const [draftAmount, setDraftAmount] = useState("");

  const exportCsv = () => {
    const rows = data ?? [];
    const header = "id,partner,amount,currency,status,method,createdAt\n";
    const body = rows
      .map(
        (p) =>
          `${p.id},${p.partnerName ?? p.partnerId},${p.amount},${p.currency ?? "USD"},${p.status},${p.method ?? "manual"},${p.createdAt}`
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payouts-${tenantId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingState message="Loading payouts..." className="text-slate-400" />;
  if (error) return <p className="text-red-400">{error}</p>;

  return (
    <div className="space-y-6">
      <OpsPageHeader
        title="Payouts"
        subtitle="Manual payout workflow — no automatic transfers in closed pilot"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={exportCsv}
          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
        >
          Export CSV
        </button>
      </div>

      {admin && (
        <SectionCard title="Create payout draft">
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm">
              Partner
              <select
                value={draftPartnerId}
                onChange={(e) => setDraftPartnerId(e.target.value)}
                className="mt-1 block rounded border border-slate-700 bg-slate-900 px-2 py-1"
              >
                <option value="">Select partner</option>
                {(partners ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm">
              Amount
              <input
                type="number"
                min="0"
                step="0.01"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.target.value)}
                className="mt-1 block rounded border border-slate-700 bg-slate-900 px-2 py-1"
              />
            </label>
            <button
              type="button"
              className="rounded bg-violet-700 px-4 py-2 text-sm"
              disabled={!draftPartnerId || !draftAmount}
              onClick={async () => {
                await createPayout(tenantId, {
                  partnerId: draftPartnerId,
                  amount: parseFloat(draftAmount),
                  currency: "USD",
                });
                setDraftAmount("");
                await reload();
              }}
            >
              Create draft
            </button>
          </div>
        </SectionCard>
      )}

      <SectionCard title="Payout records">
        <OpsTable
          columns={[
            { key: "id", label: "ID" },
            { key: "partner", label: "Partner" },
            { key: "amount", label: "Amount" },
            { key: "status", label: "Status" },
            { key: "method", label: "Method" },
            { key: "created", label: "Created" },
            { key: "approved", label: "Approved" },
            { key: "paid", label: "Paid" },
            { key: "notes", label: "Notes / Actions" },
          ]}
          rows={(data ?? []).map((p) => ({
            id: p.id,
            partner: p.partnerName ?? p.partnerId,
            amount: formatMoney(p.amount, p.currency),
            status: <OpsStatusBadge status={p.status} />,
            method: p.method ?? "manual",
            created: formatDate(p.createdAt),
            approved: p.approvedAt ? formatDate(p.approvedAt) : "—",
            paid: p.paidAt ? formatDate(p.paidAt) : "—",
            notes: (
              <div className="space-y-2 min-w-[220px]">
                <p className="text-xs text-slate-400">{p.notes ?? p.failureReason ?? "—"}</p>
                <input
                  type="text"
                  placeholder="Add note..."
                  value={noteDraft[p.id] ?? ""}
                  onChange={(e) =>
                    setNoteDraft((prev) => ({ ...prev, [p.id]: e.target.value }))
                  }
                  className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
                />
                <div className="flex flex-wrap gap-1">
                  {admin && (p.status === "draft" || p.status === "pending_approval") && (
                    <button
                      type="button"
                      className="rounded bg-violet-700 px-2 py-1 text-xs"
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, { action: "approve" });
                        await reload();
                      }}
                    >
                      Approve
                    </button>
                  )}
                  {admin && p.status === "approved" && (
                    <button
                      type="button"
                      className="rounded bg-emerald-800 px-2 py-1 text-xs"
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, {
                          action: "paid",
                          notes: noteDraft[p.id],
                        });
                        await reload();
                      }}
                    >
                      Mark paid
                    </button>
                  )}
                  {admin && p.status === "approved" && (
                    <button
                      type="button"
                      className="rounded bg-red-900 px-2 py-1 text-xs"
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, {
                          action: "failed",
                          reason: noteDraft[p.id] || "Manual failure",
                        });
                        await reload();
                      }}
                    >
                      Mark failed
                    </button>
                  )}
                  {admin && p.status !== "paid" && p.status !== "cancelled" && (
                    <button
                      type="button"
                      className="rounded bg-slate-700 px-2 py-1 text-xs"
                      onClick={async () => {
                        await updatePayout(tenantId, p.id, { action: "cancel" });
                        await reload();
                      }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ),
          }))}
        />
      </SectionCard>
    </div>
  );
}
