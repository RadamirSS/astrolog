"use client";

import { useEffect, useState } from "react";
import type { ReportLibraryItem, ReportLibraryStatus } from "@astro/tenant-config";
import type { Entitlement, PremiumRequest, PremiumRequestStatus } from "@astro/api-contracts";
import {
  getCatalogDef,
  getProductByType,
  getVisualPackForProduct,
  getVisualPackForTopic,
} from "@astro/tenant-config";
import {
  checkReportAccess,
  getReport,
  getUserEntitlements,
  listMyPremiumRequests,
  retryOrderReport,
} from "@astro/api-client";
import { useT } from "@astro/i18n";
import {
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  PageShell,
  ReportPreviewCard,
  SectionHeader,
} from "@astro/ui";
import { syncReportLibraryWithEntitlements } from "@astro/tenant-config";
import { useMiniApp, useMiniAppNav } from "../context";
import { useMiniAppAnalytics, useTrackOnce } from "../useAnalytics";

const STATUS_LABELS: Record<ReportLibraryStatus, string> = {
  locked: "miniapp.reports.status.locked",
  pending_payment: "miniapp.reports.status.pendingPayment",
  paid_generating: "miniapp.reports.status.generating",
  ready: "miniapp.reports.status.ready",
  failed: "miniapp.reports.status.failed",
  revoked: "miniapp.reports.status.revoked",
};

export function MyReportsScreen() {
  const { config, reportLibrary, report, birthProfile, userId, setReport, setReportLibrary } =
    useMiniApp();
  const nav = useMiniAppNav();
  const { track } = useMiniAppAnalytics();
  const t = useT();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(true);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [entitlements, setEntitlements] = useState<Entitlement[]>([]);

  const premiumStatusLabel = (status: PremiumRequestStatus) => {
    const key = `miniapp.premium.statusLabels.${status}` as const;
    return t(key);
  };

  useTrackOnce("my_reports_viewed");

  async function refreshEntitlements() {
    setRefreshing(true);
    setRefreshError(null);
    try {
      const [ents, premium] = await Promise.all([
        getUserEntitlements({ tenantId: config.tenantId }),
        listMyPremiumRequests({ tenantId: config.tenantId, userId }),
      ]);
      const library = syncReportLibraryWithEntitlements(reportLibrary, {
        tenantSlug: config.slug,
        locale: "ru",
        report,
        entitlements: ents,
      });
      setReportLibrary(library);
      setPremiumRequests(premium);
      setEntitlements(ents);
    } catch {
      setRefreshError(t("miniapp.reports.openError"));
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshEntitlements();
  }, [config.tenantId, config.slug, userId, report, setReportLibrary]);

  function getItemVisualPack(item: ReportLibraryItem) {
    const product = config.products.find((p) => p.id === item.productId);
    if (product) return getVisualPackForProduct(product);
    if (item.theme) return getVisualPackForTopic(item.theme);
    const byType = getProductByType(config.products, item.productType);
    return byType ? getVisualPackForProduct(byType) : "cosmic_pastel";
  }

  function getItemDepthLabel(item: ReportLibraryItem) {
    try {
      const def = getCatalogDef(item.productType);
      return def.formatRu;
    } catch {
      return undefined;
    }
  }

  function navigateToReport(item: ReportLibraryItem) {
    if (item.productType === "free_report") {
      nav.goReport();
    } else if (item.reportId) {
      nav.goPaidReport(item.reportId);
    } else {
      nav.goReport();
    }
  }

  async function openReportItem(item: ReportLibraryItem) {
    if (!item.reportId || item.status !== "ready") return;
    setOpeningId(item.id);
    setOpenError(null);
    try {
      const access = await checkReportAccess(config.tenantId, item.reportId, {});
      if (!access.allowed) {
        if (access.entitlementStatus === "revoked") {
          track("report_failed_viewed", { reportId: item.reportId, reason: "revoked" });
        }
        setOpenError(t("miniapp.reports.accessDenied"));
        return;
      }
      const loaded = await getReport(item.reportId);
      setReport(loaded);
      track(item.productType === "free_report" ? "report_opened" : "paid_report_opened", {
        reportId: item.reportId,
        productType: item.productType,
        source: "my_reports",
      });
      navigateToReport(item);
    } catch {
      setOpenError(t("miniapp.reports.openError"));
    } finally {
      setOpeningId(null);
    }
  }

  function handleDownloadPdf(item: ReportLibraryItem) {
    if (!item.pdfUrl) return;
    track("pdf_downloaded", { reportId: item.reportId, productType: item.productType });
    window.open(item.pdfUrl, "_blank", "noopener,noreferrer");
  }

  async function handleFailedRetry(item: ReportLibraryItem) {
    track("report_failed_viewed", { productType: item.productType });
    track("report_retry_clicked", { productId: item.productId });
    const ent = entitlements.find(
      (e) => e.productType === item.productType || e.reportId === item.reportId
    );
    if (ent?.orderId) {
      try {
        await retryOrderReport(config.tenantId, ent.orderId);
        await refreshEntitlements();
        return;
      } catch {
        setOpenError(t("miniapp.reports.openError"));
      }
    }
    track("support_needed_clicked", { productType: item.productType });
    nav.goProductDetail(item.productId);
  }

  function handleItemAction(item: ReportLibraryItem) {
    if (item.premiumRequestId) {
      nav.goPremiumStatus(item.premiumRequestId);
      return;
    }
    if (item.productType === "free_report" && item.status === "locked") {
      if (birthProfile) nav.goOnboarding(birthProfile.topic);
      else nav.goHome();
      return;
    }
    if (item.status === "failed") {
      void handleFailedRetry(item);
      return;
    }
    if (item.status === "ready" && item.reportId) {
      if (item.productType === "free_report" && report) {
        track("report_opened", { reportId: report.id });
        nav.goReport();
        return;
      }
      void openReportItem(item);
      return;
    }
    if (item.status === "locked" || item.status === "pending_payment") {
      track("product_clicked", { productId: item.productId, source: "my_reports" });
      nav.goProductDetail(item.productId);
    }
    if (item.status === "revoked") {
      track("support_needed_clicked", { productType: item.productType });
    }
  }

  function getFreeActionLabel(item: ReportLibraryItem) {
    if (item.productType === "free_report" && item.status === "locked") {
      return t("miniapp.reports.getFreeReport");
    }
    return undefined;
  }

  const reportItems = reportLibrary.filter((i) => i.productType !== "premium_consultation");

  return (
    <PageShell title={t("miniapp.reports.title")} subtitle={t("miniapp.reports.subtitle")}>
      <div className="overflow-x-hidden pb-24 min-w-0">
        {openError && <p className="mb-3 text-center text-xs text-red-400">{openError}</p>}
        {refreshing ? (
          <LoadingState message={t("common.loading")} />
        ) : refreshError ? (
          <ErrorState
            title={t("miniapp.reports.openError")}
            description={refreshError}
            onRetry={() => void refreshEntitlements()}
            retryLabel={t("miniapp.reports.retry")}
          />
        ) : reportItems.length === 0 && premiumRequests.length === 0 ? (
          <EmptyState
            icon="📚"
            title={t("miniapp.reports.emptyTitle")}
            description={t("miniapp.reports.emptyDesc")}
            action={<Button onClick={nav.goHome}>{t("miniapp.reports.startFunnel")}</Button>}
          />
        ) : (
          <div className="flex flex-col gap-3 min-w-0">
            <SectionHeader title={t("miniapp.reports.library")} />
            {reportItems.map((item) => (
              <ReportPreviewCard
                key={item.id}
                title={item.title}
                status={item.status}
                statusLabel={t(STATUS_LABELS[item.status])}
                visualPack={getItemVisualPack(item)}
                depthLabel={getItemDepthLabel(item)}
                onOpen={
                  item.status === "ready" && item.reportId && !item.premiumRequestId
                    ? () => handleItemAction(item)
                    : undefined
                }
                onViewProduct={
                  item.status === "locked" || item.status === "pending_payment"
                    ? () => handleItemAction(item)
                    : undefined
                }
                onRetry={item.status === "failed" ? () => handleItemAction(item) : undefined}
                onDownloadPdf={
                  item.status === "ready" && item.pdfUrl
                    ? () => handleDownloadPdf(item)
                    : undefined
                }
                onSupport={item.status === "revoked" ? () => handleItemAction(item) : undefined}
                openLabel={
                  openingId === item.id ? t("common.loading") : t("miniapp.reports.openReport")
                }
                viewProductLabel={getFreeActionLabel(item) ?? t("miniapp.reports.viewProduct")}
                generatingLabel={t("miniapp.reports.generating")}
                retryLabel={t("miniapp.reports.retry")}
                pdfLabel={t("miniapp.reports.pdfDownload")}
                pdfUnavailableLabel={
                  item.status === "paid_generating"
                    ? t("miniapp.reports.pdfPreparing")
                    : t("miniapp.reports.pdfUnavailable")
                }
                hasPdf={Boolean(item.pdfUrl)}
              />
            ))}
            {premiumRequests.length > 0 && (
              <>
                <div className="mt-4">
                  <SectionHeader title={t("miniapp.reports.premiumSection")} />
                </div>
                {premiumRequests.map((pr) => (
                  <ReportPreviewCard
                    key={pr.id}
                    title={pr.productTitle}
                    status="ready"
                    statusLabel={premiumStatusLabel(pr.status)}
                    visualPack="dark_gold_mystic"
                    isPremiumRequest
                    onPremiumStatus={() => {
                      track("premium_request_status_viewed", { requestId: pr.id });
                      nav.goPremiumStatus(pr.id);
                    }}
                    premiumStatusLabel={t("miniapp.reports.premiumStatus")}
                  />
                ))}
              </>
            )}
            {report && (
              <p className="text-center text-xs text-[var(--color-text-muted)]">
                {t("miniapp.reports.freeReportHint")}
              </p>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
