"use client";

import type { ReportLibraryStatus, VisualPack } from "@astro/tenant-config";
import { Button } from "../Button";
import { ProductPdfMockup } from "./ProductPdfMockup";

interface ReportPreviewCardProps {
  title: string;
  status: ReportLibraryStatus;
  statusLabel: string;
  visualPack: VisualPack;
  depthLabel?: string;
  onOpen?: () => void;
  onViewProduct?: () => void;
  onRetry?: () => void;
  onDownloadPdf?: () => void;
  onPremiumStatus?: () => void;
  onSupport?: () => void;
  openLabel?: string;
  viewProductLabel?: string;
  generatingLabel?: string;
  retryLabel?: string;
  pdfLabel?: string;
  pdfUnavailableLabel?: string;
  premiumStatusLabel?: string;
  supportLabel?: string;
  hasPdf?: boolean;
  isPremiumRequest?: boolean;
}

const STATUS_STYLES: Record<ReportLibraryStatus, string> = {
  ready: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  locked: "bg-gray-500/15 text-gray-600",
  pending_payment: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  paid_generating: "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  failed: "bg-red-500/15 text-red-700 dark:text-red-400",
  revoked: "bg-gray-500/15 text-gray-500",
};

export function ReportPreviewCard({
  title,
  status,
  statusLabel,
  visualPack,
  depthLabel,
  onOpen,
  onViewProduct,
  onRetry,
  onDownloadPdf,
  onPremiumStatus,
  onSupport,
  openLabel = "Открыть",
  viewProductLabel = "Смотреть продукт",
  generatingLabel = "Генерируется…",
  retryLabel = "Повторить",
  pdfLabel = "Скачать PDF",
  pdfUnavailableLabel = "PDF скоро",
  premiumStatusLabel = "Статус заявки",
  supportLabel = "Поддержка",
  hasPdf = false,
  isPremiumRequest = false,
}: ReportPreviewCardProps) {
  return (
    <div
      className="rounded-2xl border p-4 min-w-0 overflow-hidden"
      style={{
        background: "var(--color-surface)",
        borderColor: "var(--color-border)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex gap-3 min-w-0">
        <div className="w-16 shrink-0">
          <ProductPdfMockup
            pack={visualPack}
            title={title}
            depthLabel={depthLabel}
            locked={status === "locked" || status === "pending_payment"}
            className="!max-h-[80px] !aspect-[3/4]"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-medium text-[var(--color-text)] line-clamp-2">{title}</h3>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[status]}`}
            >
              {statusLabel}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {isPremiumRequest && onPremiumStatus && (
              <Button variant="secondary" className="flex-1 min-w-[120px]" onClick={onPremiumStatus}>
                {premiumStatusLabel}
              </Button>
            )}
            {!isPremiumRequest && status === "ready" && onOpen && (
              <Button variant="secondary" className="flex-1 min-w-[120px]" onClick={onOpen}>
                {openLabel}
              </Button>
            )}
            {(status === "locked" || status === "pending_payment") && onViewProduct && (
              <Button variant="secondary" className="flex-1 min-w-[120px]" onClick={onViewProduct}>
                {viewProductLabel}
              </Button>
            )}
            {status === "paid_generating" && (
              <Button variant="ghost" className="flex-1 min-w-[120px]" disabled>
                {generatingLabel}
              </Button>
            )}
            {status === "failed" && onRetry && (
              <Button variant="ghost" className="flex-1 min-w-[120px]" onClick={onRetry}>
                {retryLabel}
              </Button>
            )}
            {status === "revoked" && onSupport && (
              <Button variant="ghost" className="flex-1 min-w-[120px]" onClick={onSupport}>
                {supportLabel}
              </Button>
            )}
            {status === "ready" && hasPdf && onDownloadPdf && (
              <Button variant="ghost" className="text-xs min-w-[100px]" onClick={onDownloadPdf}>
                {pdfLabel}
              </Button>
            )}
            {status === "ready" && !hasPdf && !isPremiumRequest && (
              <span className="text-[10px] text-[var(--color-text-muted)] self-center px-1">
                {pdfUnavailableLabel}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
