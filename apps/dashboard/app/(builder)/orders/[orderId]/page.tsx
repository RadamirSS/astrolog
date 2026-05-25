"use client";

import Link from "next/link";
import {
  getOrder,
  retryOrderReport,
  revokeEntitlement,
  setOrderNeedsReview,
  setOrderNotes,
  syncOrderPayment,
  syncOrderReport,
  unlockEntitlement,
  approveMockPayment,
} from "@astro/api-client";
import { Button, ErrorState, FormActions, LoadingState, SectionCard } from "@astro/ui";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CopyButton,
  OpsPageHeader,
  OpsStatusBadge,
  formatDate,
  formatMoney,
} from "../../../../components/ops/OpsShared";
import { useOpsQuery } from "../../../../hooks/useOpsData";

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const tenantId =
    searchParams.get("tenantId") ??
    process.env.NEXT_PUBLIC_DEFAULT_DASHBOARD_TENANT_ID ??
    "tenant_mystic";
  const q = `?tenantId=${tenantId}`;
  const orderId = params.orderId;

  const { data: order, loading, error, reload } = useOpsQuery(
    () => getOrder(tenantId, orderId),
    [tenantId, orderId]
  );

  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function runAction(name: string, fn: () => Promise<unknown>) {
    setActionLoading(name);
    try {
      await fn();
      await reload();
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) return <LoadingState message="Loading order..." className="text-slate-400" />;
  if (error || !order) {
    return (
      <ErrorState
        title={error ?? "Order not found"}
        onRetry={() => void reload()}
        retryLabel="Retry"
      />
    );
  }

  const displayNotes = notes || order.notes || "";

  return (
    <div className="space-y-6">
      <OpsPageHeader title={`Order ${order.id}`} subtitle={order.productTitle} />
      <Link href={`/orders${q}`} className="text-sm text-violet-400 hover:underline">
        ← Back to orders
      </Link>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Summary">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Product</dt>
              <dd>{order.productTitle}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Theme</dt>
              <dd>{order.theme ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Amount</dt>
              <dd>{formatMoney(order.amount, order.currency)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">User/session</dt>
              <dd>{order.userId ?? order.sessionId ?? "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Created</dt>
              <dd>{formatDate(order.createdAt)}</dd>
            </div>
            {order.paidAt && (
              <div className="flex justify-between">
                <dt className="text-slate-400">Paid at</dt>
                <dd>{formatDate(order.paidAt)}</dd>
              </div>
            )}
          </dl>
        </SectionCard>

        <SectionCard title="Status">
          <div className="flex flex-wrap gap-2">
            <OpsStatusBadge status={order.paymentStatus} />
            <OpsStatusBadge status={order.reportStatus} />
            <OpsStatusBadge status={order.status} />
            {order.entitlementStatus && (
              <OpsStatusBadge status={order.entitlementStatus} />
            )}
          </div>
          {order.needsReview && (
            <p className="mt-2 text-xs text-amber-400">Flagged for manual review</p>
          )}
          {order.lastSyncAt && (
            <p className="mt-2 text-xs text-slate-500">
              Last sync: {formatDate(order.lastSyncAt)}
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Integration operations">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("payment", () => syncOrderPayment(tenantId, orderId))}
          >
            {actionLoading === "payment" ? "Checking..." : "Check payment status"}
          </Button>
          {order.mockPaymentApprovalAllowed && order.paymentStatus !== "paid" && (
            <Button
              variant="secondary"
              disabled={Boolean(actionLoading)}
              onClick={() =>
                runAction("mockApprove", () => approveMockPayment(tenantId, orderId))
              }
            >
              {actionLoading === "mockApprove" ? "Approving..." : "Approve mock payment"}
            </Button>
          )}
          <Button
            variant="secondary"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("report", () => syncOrderReport(tenantId, orderId))}
          >
            {actionLoading === "report" ? "Checking..." : "Check report status"}
          </Button>
          <Button
            variant="secondary"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("retry", () => retryOrderReport(tenantId, orderId))}
          >
            {actionLoading === "retry" ? "Retrying..." : "Retry report generation"}
          </Button>
          <Button
            variant="ghost"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("review", () => setOrderNeedsReview(tenantId, orderId, true))}
          >
            Mark needs review
          </Button>
          <Button
            variant="ghost"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("revoke", () => revokeEntitlement(tenantId, orderId))}
          >
            Revoke entitlement (manual)
          </Button>
          <Button
            variant="ghost"
            disabled={Boolean(actionLoading)}
            onClick={() => runAction("unlock", () => unlockEntitlement(tenantId, orderId))}
          >
            Unlock entitlement (manual)
          </Button>
        </div>
        {(order.reportErrorCode || order.reportErrorMessage) && (
          <div className="mt-4 rounded-lg border border-red-900/50 bg-red-950/20 p-3 text-xs">
            <p className="font-medium text-red-300">Report error</p>
            <p className="text-red-200/80">{order.reportErrorCode}</p>
            <p className="text-slate-400">{order.reportErrorMessage}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Partner attribution">
        <dl className="grid gap-2 text-sm md:grid-cols-2">
          <div>
            <dt className="text-slate-400">Partner</dt>
            <dd>{order.partnerSlug ?? "Direct"}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Campaign</dt>
            <dd>{order.campaignId ?? "—"}</dd>
          </div>
        </dl>
      </SectionCard>

      <SectionCard title="External references">
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">Order ID:</span>
            <code>{order.id}</code>
            <CopyButton value={order.id} />
          </div>
          {order.externalPaymentId && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">External payment ID:</span>
              <code>{order.externalPaymentId}</code>
              <CopyButton value={order.externalPaymentId} />
            </div>
          )}
          {order.paymentUrl && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Payment URL:</span>
              <code className="max-w-xs truncate">{order.paymentUrl}</code>
              <CopyButton value={order.paymentUrl} />
            </div>
          )}
          {order.entitlementId && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">Entitlement ID:</span>
              <code>{order.entitlementId}</code>
              <CopyButton value={order.entitlementId} />
            </div>
          )}
          {order.externalReportId && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400">External report ID:</span>
              <code>{order.externalReportId}</code>
              <CopyButton value={order.externalReportId} />
              {typeof order.reportProgress === "number" && (
                <span className="text-slate-400">Progress: {order.reportProgress}%</span>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-400">Report PDF:</span>
            {order.pdfUrl ? (
              <>
                <a
                  href={order.pdfUrl}
                  className="text-violet-400 underline truncate max-w-md"
                  target="_blank"
                  rel="noreferrer"
                >
                  {order.pdfUrl}
                </a>
                <CopyButton value={order.pdfUrl} />
              </>
            ) : (
              <span className="text-slate-500">PDF недоступен</span>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Timeline (placeholder)">
        <ul className="space-y-2 text-sm text-slate-400">
          <li>{formatDate(order.createdAt)} — Order created</li>
          {order.paidAt && <li>{formatDate(order.paidAt)} — Payment marked paid (mock)</li>}
          {order.refundedAt && <li>{formatDate(order.refundedAt)} — Refunded (mock)</li>}
        </ul>
      </SectionCard>

      <SectionCard title="Admin notes">
        <textarea
          value={displayNotes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          placeholder="Internal note for ops review..."
        />
        <FormActions
          onSave={async () => {
            setSaving(true);
            await setOrderNotes(tenantId, orderId, displayNotes);
            await reload();
            setSaving(false);
          }}
          saving={saving}
          isDirty={Boolean(displayNotes)}
          saveLabel="Save note"
        />
      </SectionCard>
    </div>
  );
}
