"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useT } from "@astro/i18n";
import { type ReportAction, isReportV2 } from "@astro/tenant-config";
import { checkReportAccess, getReport } from "@astro/api-client";
import { ReportRenderer } from "@astro/report-renderer";
import { Button, EmptyState, ErrorState, LoadingState, PageShell } from "@astro/ui";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics } from "../useAnalytics";

interface ReportScreenProps {
  reportId?: string;
}

export function ReportScreen({ reportId: routeReportId }: ReportScreenProps = {}) {
  const { config, report, hydrated, setReport } = useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const viewedRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [loadingReport, setLoadingReport] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);

  const activeProducts = config.products.filter((p) => p.status === "active");
  const bundleProduct = activeProducts.find((p) => p.productType === "bundle_all_topics");
  const mainProduct = activeProducts.find((p) => p.productType === "main_natal_portrait");
  const premiumProduct = activeProducts.find((p) => p.level === "premium");

  const needsFetch =
    Boolean(routeReportId) && (!report || (isReportV2(report) ? report.id : report.id) !== routeReportId);

  useEffect(() => {
    if (!hydrated || !routeReportId || !needsFetch) return;
    let cancelled = false;
    async function loadPaidReport() {
      setLoadingReport(true);
      setLoadError(null);
      setAccessDenied(false);
      viewedRef.current = false;
      try {
        const access = await checkReportAccess(config.tenantId, routeReportId!, {});
        if (cancelled) return;
        if (!access.allowed) {
          setAccessDenied(true);
          if (access.entitlementStatus === "revoked") {
            track("report_failed_viewed", { reportId: routeReportId, reason: "revoked" });
          }
          return;
        }
        const loaded = await getReport(routeReportId!);
        if (cancelled) return;
        if (isReportV2(loaded) && loaded.status === "failed") {
          setLoadError(t("miniapp.report.reportFailedDesc"));
          track("report_failed_viewed", { reportId: routeReportId, reason: "failed" });
          return;
        }
        setReport(loaded);
      } catch {
        if (!cancelled) setLoadError(t("miniapp.reports.openError"));
      } finally {
        if (!cancelled) setLoadingReport(false);
      }
    }
    void loadPaidReport();
    return () => {
      cancelled = true;
    };
  }, [hydrated, routeReportId, needsFetch, config.tenantId, setReport, track, t]);

  const sectionIndex = useMemo(() => {
    if (!report || !isReportV2(report)) return [];
    return [...report.sections]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ id: s.id, title: s.title }));
  }, [report]);

  useEffect(() => {
    if (hydrated && report && !viewedRef.current && !loadingReport) {
      viewedRef.current = true;
      const isPaid = isReportV2(report) && report.level !== "free";
      const event = isPaid ? "paid_report_opened" : "free_report_viewed";
      track(event, {
        reportId: report.id,
        productType: isReportV2(report) ? report.productType : report.type,
        source: routeReportId ? "deep_link" : "session",
      });
    }
  }, [hydrated, report, track, loadingReport, routeReportId]);

  useEffect(() => {
    function onScroll() {
      const el = contentRef.current;
      if (!el) return;
      const max = el.scrollHeight - el.clientHeight;
      setScrollProgress(max > 0 ? Math.min(100, Math.round((el.scrollTop / max) * 100)) : 0);
    }
    const el = contentRef.current;
    el?.addEventListener("scroll", onScroll);
    return () => el?.removeEventListener("scroll", onScroll);
  }, [report]);

  function handleAction(action: ReportAction) {
    if (action.type === "open_paywall") {
      nav.goPaywall();
      return;
    }
    if (action.type === "download_pdf" && report && isReportV2(report) && report.pdfUrl) {
      track("pdf_downloaded", { reportId: report.id });
      window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (action.type === "request_premium" && premiumProduct) {
      track("premium_request_started", { source: "report" });
      nav.goPremiumRequest(premiumProduct.id);
      return;
    }
    if (action.productId) {
      track("product_clicked", { productId: action.productId, source: "report_action" });
      nav.goProductDetail(action.productId);
    }
  }

  function handleDownloadPdf() {
    if (!report || !isReportV2(report) || !report.pdfUrl) return;
    track("pdf_downloaded", { reportId: report.id });
    window.open(report.pdfUrl, "_blank", "noopener,noreferrer");
  }

  if (!hydrated || loadingReport) {
    return (
      <PageShell title={t("miniapp.report.title")}>
        <LoadingState message={t("miniapp.report.loading")} />
      </PageShell>
    );
  }

  if (accessDenied) {
    return (
      <PageShell title={t("miniapp.report.title")}>
        <EmptyState
          icon="🔒"
          title={t("miniapp.reports.accessDenied")}
          description={t("miniapp.report.accessDeniedDesc")}
          action={
            <Button onClick={nav.goReports}>{t("miniapp.report.myReports")}</Button>
          }
        />
      </PageShell>
    );
  }

  if (loadError) {
    return (
      <PageShell title={t("miniapp.report.title")}>
        <ErrorState
          title={t("miniapp.report.reportFailedTitle")}
          description={loadError}
          onRetry={
            routeReportId
              ? () => {
                  setLoadError(null);
                  setLoadingReport(true);
                  void checkReportAccess(config.tenantId, routeReportId, {})
                    .then((access) => {
                      if (!access.allowed) {
                        setAccessDenied(true);
                        return null;
                      }
                      return getReport(routeReportId);
                    })
                    .then((loaded) => {
                      if (loaded) setReport(loaded);
                    })
                    .catch(() => setLoadError(t("miniapp.reports.openError")))
                    .finally(() => setLoadingReport(false));
                }
              : undefined
          }
          retryLabel={t("miniapp.reports.retry")}
          action={
            <Button variant="ghost" onClick={nav.goReports}>
              {t("miniapp.report.myReports")}
            </Button>
          }
        />
      </PageShell>
    );
  }

  if (!report) {
    return (
      <PageShell title={t("miniapp.report.title")}>
        <EmptyState
          icon="✦"
          title={t("miniapp.report.emptyTitle")}
          description={t("miniapp.report.emptyDesc")}
          action={
            config.modules.onboarding ? (
              <Button onClick={() => nav.goHome()}>{t("miniapp.report.startOnboarding")}</Button>
            ) : undefined
          }
        />
      </PageShell>
    );
  }

  const pdfUrl = isReportV2(report) ? report.pdfUrl : null;

  return (
    <PageShell
      subtitle={config.content.reportIntro}
      footer={
        <div className="flex flex-col gap-2 pb-2">
          {bundleProduct && (
            <Button variant="secondary" fullWidth onClick={() => nav.goProductDetail(bundleProduct.id)}>
              {t("miniapp.report.upsellBundle")}
            </Button>
          )}
          {mainProduct && (
            <Button variant="secondary" fullWidth onClick={() => nav.goProductDetail(mainProduct.id)}>
              {t("miniapp.report.upsellMain")}
            </Button>
          )}
          {premiumProduct && (
            <Button variant="ghost" fullWidth onClick={() => nav.goPremiumRequest(premiumProduct.id)}>
              {t("miniapp.report.upsellPremium")}
            </Button>
          )}
          <Button fullWidth onClick={nav.goPaywall}>
            {t("miniapp.report.viewPaywall")}
          </Button>
          <Button variant="secondary" onClick={nav.goReports}>
            {t("miniapp.report.myReports")}
          </Button>
        </div>
      }
    >
      <div ref={contentRef} className="max-h-[70vh] overflow-y-auto overflow-x-hidden min-w-0 pb-4">
        {isReportV2(report) && (
          <div className="mb-3 flex flex-col gap-2 sticky top-0 z-10 bg-[var(--color-bg)]/90 py-2 backdrop-blur min-w-0">
            {pdfUrl ? (
              <Button variant="secondary" className="w-full" onClick={handleDownloadPdf}>
                {t("miniapp.report.pdfDownload")}
              </Button>
            ) : (
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                {report.status === "generating" || report.status === "queued"
                  ? t("miniapp.report.pdfPreparing")
                  : t("miniapp.report.pdfUnavailable")}
              </p>
            )}
            {sectionIndex.length > 1 && (
              <div className="flex flex-wrap gap-1 min-w-0">
                <span className="text-[10px] text-[var(--color-text-muted)] w-full">
                  {t("miniapp.report.sectionIndex")}
                </span>
                {sectionIndex.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="rounded-full border px-2 py-0.5 text-[10px] max-w-full truncate"
                    style={{ borderColor: "var(--color-border)" }}
                    onClick={() =>
                      document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    {s.title}
                  </button>
                ))}
              </div>
            )}
            <div className="h-1 rounded-full bg-[var(--color-border)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-center text-[var(--color-text-muted)]">
              {t("miniapp.report.readingProgress")}: {scrollProgress}%
            </p>
          </div>
        )}
        <ReportRenderer
          report={report}
          products={activeProducts}
          onCta={() => nav.goPaywall()}
          onUnlock={(productId) => {
            track("product_clicked", { productId, source: "report_unlock" });
            if (productId) nav.goProductDetail(productId);
            else nav.goPaywall();
          }}
          onProductClick={(id) => {
            if (!id) return;
            track("product_clicked", { productId: id, source: "report_recommended" });
            nav.goProductDetail(id);
          }}
          onAction={handleAction}
        />
      </div>
    </PageShell>
  );
}
