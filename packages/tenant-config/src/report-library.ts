import type { AnyReport, ReportLibraryItem, ReportLibraryStatus } from "./types";
import { createMockReportLibrary, getCatalogDef } from "./product-catalog";

export interface EntitlementLike {
  id: string;
  productType: ReportLibraryItem["productType"];
  reportId?: string;
  pdfUrl?: string | null;
  status: "locked" | "pending_payment" | "paid_generating" | "ready" | "failed" | "revoked";
  updatedAt: string;
}

export interface SyncReportLibraryOptions {
  tenantSlug: string;
  locale?: "en" | "ru";
  report: Pick<AnyReport, "id"> | null;
}

function entitlementToLibraryStatus(status: EntitlementLike["status"]): ReportLibraryStatus {
  if (status === "pending_payment") return "pending_payment";
  if (status === "paid_generating") return "paid_generating";
  if (status === "ready") return "ready";
  if (status === "failed") return "failed";
  if (status === "revoked") return "revoked";
  return "locked";
}

/** Keeps free-report library status aligned with an actual session report. */
export function syncReportLibraryWithSession(
  library: ReportLibraryItem[],
  options: SyncReportLibraryOptions
): ReportLibraryItem[] {
  const locale = options.locale ?? "ru";
  const base =
    library.length > 0 ? library : createMockReportLibrary(options.tenantSlug, locale);

  return base.map((item) => {
    if (item.productType !== "free_report") return item;
    if (options.report) {
      return {
        ...item,
        status: "ready" as const,
        reportId: options.report.id,
        updatedAt: new Date().toISOString(),
      };
    }
    return {
      ...item,
      status: "locked" as const,
      reportId: undefined,
    };
  });
}

/** Merges paid entitlements into the report library for My Reports. */
export function syncReportLibraryWithEntitlements(
  library: ReportLibraryItem[],
  options: {
    tenantSlug: string;
    locale?: "en" | "ru";
    entitlements: EntitlementLike[];
    report: Pick<AnyReport, "id"> | null;
  }
): ReportLibraryItem[] {
  const locale = options.locale ?? "ru";
  let base = syncReportLibraryWithSession(library, {
    tenantSlug: options.tenantSlug,
    locale,
    report: options.report,
  });

  for (const ent of options.entitlements) {
    if (ent.productType === "free_report") continue;
    const def = getCatalogDef(ent.productType);
    const idx = base.findIndex((item) => item.productType === ent.productType);
    const status = entitlementToLibraryStatus(ent.status);
    const hasReadyEntitlement = ent.status === "ready" && Boolean(ent.reportId);
    const resolvedStatus =
      status === "ready" && !hasReadyEntitlement ? ("paid_generating" as const) : status;
    const productId =
      base[idx]?.productId ?? `${options.tenantSlug}-${ent.productType}`;
    const nextItem: ReportLibraryItem = {
      id: ent.id,
      productId,
      productType: ent.productType,
      title: locale === "ru" ? def.titleRu : def.titleEn,
      status: resolvedStatus,
      reportId: hasReadyEntitlement ? ent.reportId : undefined,
      pdfUrl: hasReadyEntitlement ? ent.pdfUrl ?? base[idx]?.pdfUrl : undefined,
      updatedAt: ent.updatedAt,
    };
    if (idx >= 0) {
      base = base.map((item, i) => (i === idx ? { ...item, ...nextItem } : item));
    } else {
      base = [...base, nextItem];
    }
  }

  const entitledTypes = new Set(
    options.entitlements.filter((e) => e.productType !== "free_report").map((e) => e.productType)
  );

  base = base.map((item) => {
    if (item.productType === "free_report") return item;
    if (item.status === "ready" && !entitledTypes.has(item.productType)) {
      return {
        ...item,
        status: "locked" as const,
        reportId: undefined,
        pdfUrl: undefined,
      };
    }
    return item;
  });

  return base;
}
