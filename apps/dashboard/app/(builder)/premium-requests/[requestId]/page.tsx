"use client";

import Link from "next/link";
import {
  getPremiumRequestForTenant,
  updatePremiumRequestAdmin,
} from "@astro/api-client";
import { Button, ErrorState, FormActions, LoadingState, SectionCard } from "@astro/ui";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  OpsPageHeader,
  OpsStatusBadge,
  formatDate,
} from "../../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../../hooks/useOpsData";
import { useDashboardAnalytics } from "../../../../lib/useDashboardAnalytics";
import type { PremiumRequestStatus } from "@astro/api-client";

const STATUSES: PremiumRequestStatus[] = [
  "in_review",
  "scheduled",
  "completed",
  "cancelled",
];

export default function PremiumRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const tenantSlug = searchParams.get("tenantSlug") ?? "mystic-dark";
  const q = `?tenantId=${tenantId}`;
  const requestId = params.requestId;
  const track = useDashboardAnalytics(tenantId, tenantSlug);

  const { data: request, loading, error, reload } = useOpsQuery(
    () => getPremiumRequestForTenant(tenantId, requestId),
    [tenantId, requestId]
  );

  const [note, setNote] = useState("");
  const [expert, setExpert] = useState("");
  const [finalPdfUrl, setFinalPdfUrl] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function runAction(name: string, update: Parameters<typeof updatePremiumRequestAdmin>[2]) {
    setActionLoading(name);
    try {
      await updatePremiumRequestAdmin(tenantId, requestId, update);
      if (update.status) {
        track("dashboard_premium_request_updated", {
          requestId,
          status: update.status,
        });
      }
      if (update.adminNote) {
        track("dashboard_premium_request_note_added", { requestId });
      }
      if (update.finalPdfUrl) {
        track("dashboard_premium_request_updated", {
          requestId,
          field: "finalPdfUrl",
        });
      }
      if (update.assignedExpert) {
        track("dashboard_premium_request_updated", {
          requestId,
          field: "assignedExpert",
        });
      }
      await reload();
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <LoadingState message="Loading request..." className="text-slate-400" />;
  if (error || !request) {
    return (
      <ErrorState
        title={error ?? "Request not found"}
        onRetry={() => void reload()}
        retryLabel="Retry"
      />
    );
  }

  return (
    <div className="space-y-6">
      <OpsPageHeader title={`Premium ${request.id}`} subtitle={request.productTitle} />
      <Link href={`/premium-requests${q}`} className="text-sm text-violet-400 hover:underline">
        ← Back to Premium queue
      </Link>

      <p className="text-xs text-amber-400/90">
        Pilot mode: status changes are manual. No automatic scheduling or payouts.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Client">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">User/session</dt>
              <dd>{request.userId ?? request.sessionId ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Topic</dt>
              <dd>{request.topic}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Submitted</dt>
              <dd>{formatDate(request.submittedAt ?? request.createdAt)}</dd>
            </div>
            {request.orderId && (
              <div className="flex justify-between">
                <dt className="text-slate-400">Order</dt>
                <dd>
                  <Link
                    href={`/orders/${request.orderId}${q}`}
                    className="text-violet-400 hover:underline"
                  >
                    {request.orderId}
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="Status">
          <div className="flex flex-wrap gap-2">
            <OpsStatusBadge status={request.status} />
            {request.orderStatus && <OpsStatusBadge status={request.orderStatus} />}
            {request.paymentStatus && <OpsStatusBadge status={request.paymentStatus} />}
          </div>
          {request.assignedExpert && (
            <p className="mt-2 text-sm">Expert: {request.assignedExpert}</p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Questionnaire">
        <p className="text-sm font-medium">{request.personalQuestion}</p>
        {request.context && (
          <p className="mt-2 text-sm text-slate-400">{request.context}</p>
        )}
        {request.birthProfile && (
          <dl className="mt-4 space-y-1 text-xs text-slate-400">
            <div>
              {request.birthProfile.name} · {request.birthProfile.birthDate}{" "}
              {request.birthProfile.birthTime ?? ""} · {request.birthProfile.birthPlace}
            </div>
            <div>Time accuracy: {request.birthProfile.timeAccuracy}</div>
          </dl>
        )}
        {(request.contactValue || request.desiredWindow) && (
          <p className="mt-2 text-xs text-slate-500">
            {request.contactMethod}: {request.contactValue ?? "—"}
            {request.desiredWindow ? ` · Window: ${request.desiredWindow}` : ""}
          </p>
        )}
      </SectionCard>

      {request.timeline && request.timeline.length > 0 && (
        <SectionCard title="Timeline">
          <ul className="space-y-2 text-sm text-slate-400">
            {request.timeline.map((entry, i) => (
              <li key={`${entry.at}-${i}`}>
                <OpsStatusBadge status={entry.status} /> · {formatDate(entry.at)}
                {entry.note ? ` — ${entry.note}` : ""}
              </li>
            ))}
          </ul>
        </SectionCard>
      )}

      <SectionCard title="Admin actions">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s}
              variant="secondary"
              disabled={actionLoading !== null || request.status === s}
              onClick={() => void runAction(s, { status: s })}
            >
              {actionLoading === s ? "…" : s}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3">
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Assign expert (placeholder name)"
            value={expert}
            onChange={(e) => setExpert(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!expert.trim() || actionLoading !== null}
            onClick={() => void runAction("expert", { assignedExpert: expert.trim() })}
          >
            Assign expert
          </Button>
          <textarea
            className="min-h-[64px] rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Admin note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!note.trim() || actionLoading !== null}
            onClick={() => void runAction("note", { adminNote: note.trim() })}
          >
            Add note
          </Button>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
            placeholder="Final PDF URL (https://...)"
            value={finalPdfUrl || request.finalPdfUrl || ""}
            onChange={(e) => setFinalPdfUrl(e.target.value)}
          />
          <Button
            variant="secondary"
            disabled={!finalPdfUrl.trim() || actionLoading !== null}
            onClick={() =>
              void runAction("pdf", { finalPdfUrl: finalPdfUrl.trim() || null })
            }
          >
            Save final PDF URL
          </Button>
        </div>
        {request.adminNotes && request.adminNotes.length > 0 && (
          <ul className="mt-4 list-disc pl-5 text-xs text-slate-400">
            {request.adminNotes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
        {request.finalPdfUrl && (
          <p className="mt-2 text-xs">
            PDF:{" "}
            <a href={request.finalPdfUrl} className="text-violet-400 underline" target="_blank" rel="noreferrer">
              {request.finalPdfUrl}
            </a>
          </p>
        )}
        <FormActions />
      </SectionCard>
    </div>
  );
}
