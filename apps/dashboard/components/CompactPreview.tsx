"use client";

import { useMemo } from "react";
import type { TenantConfig } from "@astro/tenant-config";
import { localizeTenantConfig } from "@astro/tenant-config";
import { MiniAppRoot, SCREEN_ORDER, type MiniAppScreen } from "@astro/miniapp-renderer";
import { useI18n, useT } from "@astro/i18n";
import { ThemeProvider } from "@astro/theme-engine";
import { Select } from "@astro/ui";

interface CompactPreviewProps {
  config: TenantConfig;
  screen?: MiniAppScreen;
  showScreenPicker?: boolean;
  onScreenChange?: (screen: MiniAppScreen) => void;
  height?: number;
  previewSource?: "draft" | "published";
  previewLabel?: string;
  previewProductId?: string;
  onProductChange?: (productId: string) => void;
}

const SCREEN_I18N_KEYS: Record<MiniAppScreen, string> = {
  home: "dashboard.preview.screenHome",
  onboarding: "dashboard.preview.screenOnboarding",
  loading: "dashboard.preview.screenLoading",
  report: "dashboard.preview.screenReport",
  paywall: "dashboard.preview.screenPaywall",
  products: "dashboard.preview.screenProducts",
  productDetail: "dashboard.preview.screenProductDetail",
  reports: "dashboard.preview.screenReports",
  profile: "dashboard.preview.screenProfile",
};

function needsPreviewSession(screen: MiniAppScreen): boolean {
  return screen === "loading" || screen === "report" || screen === "profile" || screen === "reports";
}

export function CompactPreview({
  config,
  screen = "home",
  showScreenPicker = false,
  onScreenChange,
  height = 520,
  previewSource = "draft",
  previewLabel,
  previewProductId,
  onProductChange,
}: CompactPreviewProps) {
  const t = useT();
  const { locale } = useI18n();

  const localizedConfig = useMemo(
    () => localizeTenantConfig(config, locale),
    [config, locale]
  );

  const screenOptions = useMemo(
    () =>
      SCREEN_ORDER.map((value) => ({
        value,
        label: t(SCREEN_I18N_KEYS[value]),
      })),
    [t]
  );

  const activeProducts = useMemo(
    () => localizedConfig.products.filter((p) => p.status === "active"),
    [localizedConfig.products]
  );

  const resolvedProductId =
    previewProductId ?? (screen === "productDetail" ? activeProducts[0]?.id : undefined);

  const label =
    previewLabel ??
    (previewSource === "published"
      ? t("dashboard.preview.publishedPreview")
      : t("dashboard.preview.draftPreview"));

  return (
    <div className="space-y-3">
      {showScreenPicker && onScreenChange && (
        <>
          <Select
            label={t("dashboard.preview.previewScreen")}
            value={screen}
            options={screenOptions}
            onChange={(e) => onScreenChange(e.target.value as MiniAppScreen)}
          />
          {screen === "productDetail" && activeProducts.length > 0 && onProductChange && (
            <Select
              label={t("dashboard.preview.product")}
              value={resolvedProductId ?? ""}
              options={activeProducts.map((p) => ({ value: p.id, label: p.title }))}
              onChange={(e) => onProductChange(e.target.value)}
            />
          )}
        </>
      )}
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[2rem] border-[5px] border-slate-700 bg-slate-950 shadow-xl">
        <div className="border-b border-slate-800 px-4 py-2 text-center text-xs font-medium text-violet-300">
          {label}
        </div>
        <ThemeProvider config={localizedConfig}>
          <div className="overflow-y-auto" style={{ height }}>
            <MiniAppRoot
              config={localizedConfig}
              previewMode
              initialScreen={screen}
              previewProductId={resolvedProductId}
              seedPreviewSession={needsPreviewSession(screen)}
              showPreviewNavigation
            />
          </div>
        </ThemeProvider>
      </div>
    </div>
  );
}
