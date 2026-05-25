"use client";

import {
  REAL_PRODUCT_CATALOG,
  REAL_PRODUCT_TYPES,
  syncCatalogProducts,
  type RealProductType,
} from "@astro/tenant-config";
import { FormActions, LoadingState, SectionCard, Toggle } from "@astro/ui";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { EditorLayout } from "../../../components/EditorLayout";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

export default function ProductsPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const track = useDashboardAnalytics(tenantId, config?.slug);

  if (loading || !config) {
    return <LoadingState message={t("dashboard.products.loading")} className="text-slate-400" />;
  }

  const enabledTypes = new Set(
    config.products.filter((p) => p.status === "active").map((p) => p.productType)
  );

  function toggleProduct(productType: RealProductType, active: boolean) {
    const nextTypes = new Set(enabledTypes);
    if (active) {
      nextTypes.add(productType);
    } else {
      nextTypes.delete(productType);
    }
    if (!nextTypes.has("free_report")) {
      nextTypes.add("free_report");
    }
    const ordered = REAL_PRODUCT_TYPES.filter((type) => nextTypes.has(type));
    updateConfig((prev) => ({
      ...prev,
      products: syncCatalogProducts(prev.slug, "ru", ordered),
    }));
    track("dashboard_product_updated", { productType, active });
  }

  async function handleSave() {
    await saveDraft();
    track("dashboard_product_updated", { action: "save_all" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.products.title")}</h1>
        <p className="text-slate-400">
          {t("dashboard.products.catalogSubtitle", {
            defaultValue: "Enable products from the platform catalog. Prices and definitions are managed by the platform.",
          })}
        </p>
      </div>

      <EditorLayout config={config} previewScreen="products">
        <SectionCard
          title={t("dashboard.products.catalogTitle", { defaultValue: "Platform catalog" })}
        >
          <div className="space-y-4">
            {REAL_PRODUCT_CATALOG.map((def) => {
              const active = enabledTypes.has(def.productType);
              const isFree = def.productType === "free_report";
              return (
                <div
                  key={def.productType}
                  className="flex flex-col gap-2 rounded-lg border border-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{def.titleRu}</p>
                    <p className="text-sm text-slate-400">{def.subtitleRu}</p>
                    <p className="mt-1 text-sm text-violet-300">{def.priceLabelRu}</p>
                  </div>
                  <Toggle
                    label={
                      isFree
                        ? t("dashboard.products.freeRequired", { defaultValue: "Required" })
                        : active
                          ? t("dashboard.products.enabled", { defaultValue: "Enabled" })
                          : t("dashboard.products.disabled", { defaultValue: "Disabled" })
                    }
                    checked={active}
                    disabled={isFree}
                    onChange={(checked) => toggleProduct(def.productType, checked)}
                  />
                </div>
              );
            })}
          </div>
        </SectionCard>
        <FormActions
          onSave={() => void handleSave()}
          onReset={resetToSaved}
          saving={saving}
          isDirty={isDirty}
          saveLabel={t("ui.saveChanges")}
          resetLabel={t("ui.resetToSaved")}
        />
      </EditorLayout>
    </div>
  );
}
