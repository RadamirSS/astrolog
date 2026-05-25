"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getPremiumRequest } from "@astro/api-client";
import type { PremiumRequest, PremiumRequestStatus } from "@astro/api-contracts";
import { useT } from "@astro/i18n";
import { Button, EmptyState, ErrorState, LoadingState, PageShell } from "@astro/ui";
import { useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

export function PremiumStatusScreen() {
  const params = useParams();
  const requestId = typeof params.requestId === "string" ? params.requestId : "";
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const [request, setRequest] = useState<PremiumRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useTrackOnce("premium_request_status_viewed", { requestId });

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await getPremiumRequest(requestId);
      setRequest(data);
    } catch {
      setRequest(null);
      setLoadError(t("miniapp.premium.loadError"));
    } finally {
      setLoading(false);
    }
  }, [requestId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = (status: PremiumRequestStatus) =>
    t(`miniapp.premium.statusLabels.${status}` as "miniapp.premium.statusLabels.submitted");

  if (loading) {
    return (
      <PageShell title={t("miniapp.premium.statusTitle")}>
        <LoadingState message={t("common.loading")} />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell title={t("miniapp.premium.statusTitle")}>
        <ErrorState
          title={loadError}
          onRetry={() => void load()}
          retryLabel={t("miniapp.reports.retry")}
        />
      </PageShell>
    );
  }

  if (!request) {
    return (
      <PageShell title={t("miniapp.premium.statusTitle")}>
        <EmptyState
          icon="✦"
          title={t("miniapp.productDetail.notFoundDesc")}
          action={
            <Button onClick={nav.goReports}>{t("miniapp.reports.title")}</Button>
          }
        />
      </PageShell>
    );
  }

  return (
    <PageShell title={t("miniapp.premium.statusTitle")} subtitle={request.productTitle}>
      <div className="flex flex-col gap-3 min-w-0 pb-24 overflow-x-hidden">
        <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)" }}>
          <p className="text-xs text-[var(--color-text-muted)]">{t("miniapp.premium.viewStatus")}</p>
          <p className="mt-1 text-lg font-semibold">{statusLabel(request.status)}</p>
          {request.orderStatus && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              {t("miniapp.premium.orderStatus")}: {request.orderStatus}
            </p>
          )}
          {request.paymentStatus && (
            <p className="text-xs text-[var(--color-text-muted)]">
              {t("miniapp.premium.paymentStatus")}: {request.paymentStatus}
            </p>
          )}
          <p className="mt-3 text-sm">
            <span className="text-[var(--color-text-muted)]">{t("miniapp.premium.topic")}: </span>
            {t(`miniapp.premium.topics.${request.topic}` as "miniapp.premium.topics.money")}
          </p>
          <p className="mt-2 text-sm text-[var(--color-text)]">{request.personalQuestion}</p>
          {request.context && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{request.context}</p>
          )}
          {request.birthProfile?.timeAccuracy === "unknown" && (
            <p className="mt-2 text-xs text-amber-400/90">{t("miniapp.premium.birthTimeUnknown")}</p>
          )}
          {request.finalPdfUrl && (
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => {
                track("pdf_downloaded", { source: "premium_final", requestId: request.id });
                window.open(request.finalPdfUrl!, "_blank", "noopener,noreferrer");
              }}
            >
              {t("miniapp.report.pdfDownload")}
            </Button>
          )}
        </div>
        {request.timeline && request.timeline.length > 0 && (
          <div className="rounded-xl border p-4" style={{ borderColor: "var(--color-border)" }}>
            <p className="text-xs font-medium text-[var(--color-text-muted)] mb-2">
              {t("miniapp.premium.timeline")}
            </p>
            <ul className="space-y-2 text-xs">
              {request.timeline.map((entry, i) => (
                <li key={`${entry.at}-${i}`} className="text-[var(--color-text-muted)]">
                  <span className="text-[var(--color-text)]">{statusLabel(entry.status)}</span>
                  {" · "}
                  {new Date(entry.at).toLocaleString("ru-RU")}
                  {entry.note ? ` — ${entry.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button fullWidth onClick={nav.goReports}>
          {t("miniapp.reports.title")}
        </Button>
      </div>
    </PageShell>
  );
}
