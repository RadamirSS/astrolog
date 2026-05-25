"use client";

import type {
  AnyReport,
  ProductConfig,
  Report,
  ReportAction,
  ReportV2,
} from "@astro/tenant-config";
import { isReportV2 } from "@astro/tenant-config";
import { ReportRendererV2 } from "./v2/ReportRendererV2";
import { ReportRendererV1 } from "./ReportRendererV1";

export interface UnifiedReportRendererProps {
  report: AnyReport;
  products?: ProductConfig[];
  onCta?: (action: NonNullable<Report["cta"]>) => void;
  onUnlock?: (productId?: string) => void;
  onProductClick?: (productId?: string) => void;
  onAction?: (action: ReportAction) => void;
}

export function ReportRenderer({
  report,
  products = [],
  onCta,
  onUnlock,
  onProductClick,
  onAction,
}: UnifiedReportRendererProps) {
  if (isReportV2(report)) {
    return (
      <ReportRendererV2
        report={report as ReportV2}
        products={products}
        onAction={onAction}
        onProductClick={onProductClick}
      />
    );
  }

  return (
    <ReportRendererV1
      report={report as Report}
      products={products}
      onCta={onCta}
      onUnlock={onUnlock}
      onProductClick={onProductClick}
    />
  );
}

export { ReportRendererV2 } from "./v2/ReportRendererV2";
export { ReportRendererV1 } from "./ReportRendererV1";
export { ReportHighlights } from "./ReportHighlights";
export { ReportSectionBlock } from "./ReportSection";
export { LockedSectionBlock } from "./LockedSection";
export { RecommendedProducts } from "./RecommendedProducts";
