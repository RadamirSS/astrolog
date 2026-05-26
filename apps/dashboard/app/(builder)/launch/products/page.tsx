"use client";

import {
  REAL_PRODUCT_CATALOG,
  REAL_PRODUCT_TYPES,
  syncCatalogProducts,
  type RealProductType,
} from "@astro/tenant-config";
import { FormActions, LoadingState, SectionCard, Toggle, Badge } from "@astro/ui";
import { useI18n, useT } from "@astro/i18n";
import { useDashboard } from "../../../components/DashboardProvider";

export default function LaunchProductsPage() {
  const t = useT();
  const { locale } = useI18n();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty } =
    useDashboard();

  if (loading || !config) {
    return <LoadingState message={t("dashboard.products.loading")} className="text-slate-400" />;
  }

  const enabledTypes = new Set(
    config.products.filter((p) => p.status === "active").map((p) => p.productType)
  );
  const paidActiveCount = config.products.filter(
    (p) => p.status === "active" && p.level !== "free"
  ).length;

  function toggleProduct(productType: RealProductType, active: boolean) {
    const nextTypes = new Set(enabledTypes);
    if (active) nextTypes.add(productType);
    else nextTypes.delete(productType);
    if (!nextTypes.has("free_report")) nextTypes.add("free_report");
    if (productType !== "free_report" && !active && paidActiveCount <= 1) return;
    const ordered = REAL_PRODUCT_TYPES.filter((type) => nextTypes.has(type));
    updateConfig((prev) => ({
      ...prev,
      products: syncCatalogProducts(prev.slug, locale === "ru" ? "ru" : "en", ordered),
    }));
  }

  function productTitle(productType: RealProductType): string {
    return t(`dashboard.products.displayNames.${productType}`);
  }

  function productAudience(productType: RealProductType): string {
    return t(`dashboard.products.audience.${productType}`);
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t("dashboard.products.catalogTitle")} description={t("dashboard.products.catalogDesc")}>
        <div className="space-y-3">
          {REAL_PRODUCT_TYPES.map((productType) => {
            const catalog = REAL_PRODUCT_CATALOG.find((p) => p.productType === productType);
            if (!catalog) return null;
            const active = enabledTypes.has(productType);
            const isFree = productType === "free_report";
            const isLastPaid = !isFree && active && paidActiveCount <= 1;
            const title = productTitle(productType);
            const subtitle = locale === "ru" ? catalog.subtitleRu : catalog.subtitleEn;
            const description = locale === "ru" ? catalog.descriptionRu : catalog.descriptionEn;
            const priceLabel = locale === "ru" ? catalog.priceLabelRu : catalog.priceLabelEn;

            return (
              <div
                key={productType}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-white">{title}</p>
                      {catalog.featured && (
                        <Badge variant="info">{t("dashboard.products.recommended")}</Badge>
                      )}
                    </div>
                    {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">{description}</p>
                    <p className="mt-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-400">
                        {t("dashboard.products.forAudience")}:{" "}
                      </span>
                      {productAudience(productType)}
                    </p>
                    <p className="mt-3 inline-block rounded-lg bg-slate-950 px-3 py-1.5 text-sm font-medium text-violet-300">
                      {priceLabel}
                    </p>
                  </div>
                  <Toggle
                    label=""
                    checked={active}
                    disabled={isFree || isLastPaid}
                    onChange={(checked) => toggleProduct(productType, checked)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>
      <FormActions onSave={saveDraft} onReset={resetToSaved} saving={saving} isDirty={isDirty} />
    </div>
  );
}
