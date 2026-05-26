"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { RealProductType, TenantConfig } from "@astro/tenant-config";
import {
  REAL_PRODUCT_CATALOG,
  REAL_PRODUCT_TYPES,
  getFieldError,
  getTenantConfigFieldErrors,
  syncCatalogProducts,
} from "@astro/tenant-config";
import { trackSafeSync, getApiMode, uploadTenantMedia } from "@astro/api-client";
import { THEME_PRESET_OPTIONS } from "@astro/theme-engine";
import { useT } from "@astro/i18n";
import {
  Button,
  ColorInput,
  Input,
  MediaUploadField,
  ProgressSteps,
  SectionCard,
  Textarea,
  ThemePresetCard,
  Toggle,
} from "@astro/ui";
import { CompactPreview } from "./CompactPreview";
import { SETUP_STEP_COUNT } from "../lib/setup-steps";
import { getThemePresetLabel } from "../lib/theme-preset-label";

interface SetupWizardProps {
  config: TenantConfig;
  tenantId: string;
  onUpdate: (updater: (prev: TenantConfig) => TenantConfig, options?: { immediate?: boolean }) => void;
  onComplete: () => Promise<void>;
}

export function SetupWizard({ config, tenantId, onUpdate, onComplete }: SetupWizardProps) {
  const t = useT();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const isRemote = getApiMode() === "remote";

  async function uploadBrandMedia(kind: "avatar" | "logo" | "cover", file: File) {
    const asset = await uploadTenantMedia(tenantId, file, kind);
    return asset.publicUrl;
  }

  const stepLabels = useMemo(
    () => [
      t("dashboard.setup.appIdentity"),
      t("dashboard.setup.visualStyle"),
      t("dashboard.setup.media"),
      t("dashboard.setup.mainCopy"),
      t("dashboard.setup.services"),
      t("dashboard.setup.preview"),
    ],
    [t]
  );

  useEffect(() => {
    trackSafeSync(config.tenantId, "dashboard_setup_started", { tenantSlug: config.slug });
  }, [config.tenantId, config.slug]);

  function validateStep(): boolean {
    const errors = getTenantConfigFieldErrors(config);
    if (step === 0 && getFieldError(errors, "brand.displayName")) {
      setStepError(t("dashboard.setup.errDisplayName"));
      return false;
    }
    if (step === 1) {
      const primaryErr = getFieldError(errors, "theme.overrides.primaryColor");
      const accentErr = getFieldError(errors, "theme.overrides.accentColor");
      if (primaryErr || accentErr) {
        setStepError(primaryErr ?? accentErr ?? t("dashboard.setup.errInvalidColor"));
        return false;
      }
    }
    if (step === 3) {
      if (getFieldError(errors, "content.home.headline") || getFieldError(errors, "content.home.ctaLabel")) {
        setStepError(t("dashboard.setup.errHomeRequired"));
        return false;
      }
    }
    if (step === 4) {
      const active = config.products.filter((p) => p.status === "active");
      if (active.length === 0) {
        setStepError(t("dashboard.setup.errActiveService"));
        return false;
      }
      const productErrors = errors.filter((e) => e.path.startsWith("products."));
      if (productErrors.length > 0) {
        setStepError(productErrors[0]!.message);
        return false;
      }
    }
    setStepError(null);
    return true;
  }

  async function handleNext() {
    if (!validateStep()) return;
    if (step < SETUP_STEP_COUNT - 1) {
      setStep(step + 1);
      return;
    }
    await onComplete();
    trackSafeSync(config.tenantId, "dashboard_setup_completed", { tenantSlug: config.slug });
    router.push(`/overview?tenantId=${tenantId}`);
  }

  function handleBack() {
    setStepError(null);
    setStep(Math.max(0, step - 1));
  }

  const overrides = config.theme.overrides ?? {};
  const enabledTypes = new Set(
    config.products.filter((p) => p.status === "active").map((p) => p.productType)
  );

  function toggleCatalogProduct(productType: RealProductType, active: boolean) {
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
    onUpdate((prev) => ({
      ...prev,
      products: syncCatalogProducts(prev.slug, "ru", ordered),
    }));
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.setup.title")}</h1>
        <p className="text-slate-400">{t("dashboard.setup.subtitle")}</p>
      </div>

      <ProgressSteps current={step} total={SETUP_STEP_COUNT} labels={stepLabels} />

      {stepError && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-300">
          {stepError}
        </div>
      )}

      {step === 0 && (
        <SectionCard title={t("dashboard.setup.appIdentity")}>
          <div className="space-y-4">
            <Input
              label={t("dashboard.setup.appName")}
              value={config.brand.displayName}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, displayName: e.target.value },
                }))
              }
            />
            <Input
              label={t("dashboard.setup.astrologerName")}
              value={config.brand.name ?? ""}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, name: e.target.value },
                }))
              }
            />
          </div>
        </SectionCard>
      )}

      {step === 1 && (
        <SectionCard title={t("dashboard.setup.visualStyle")}>
          <div className="grid grid-cols-2 gap-3">
            {THEME_PRESET_OPTIONS.map((option) => (
              <ThemePresetCard
                key={option.value}
                preset={option.value}
                label={getThemePresetLabel(option.value, t)}
                selected={config.theme.preset === option.value}
                onSelect={() =>
                  onUpdate((prev) => ({
                    ...prev,
                    theme: { ...prev.theme, preset: option.value },
                  }))
                }
              />
            ))}
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColorInput
              label={t("dashboard.design.primaryColor")}
              value={overrides.primaryColor ?? ""}
              onChange={(value) =>
                onUpdate((prev) => ({
                  ...prev,
                  theme: {
                    ...prev.theme,
                    overrides: { ...prev.theme.overrides, primaryColor: value || undefined },
                  },
                }))
              }
            />
            <ColorInput
              label={t("dashboard.design.accentColor")}
              value={overrides.accentColor ?? ""}
              onChange={(value) =>
                onUpdate((prev) => ({
                  ...prev,
                  theme: {
                    ...prev.theme,
                    overrides: { ...prev.theme.overrides, accentColor: value || undefined },
                  },
                }))
              }
            />
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title={t("dashboard.setup.media")}>
          <div className="space-y-4">
            <MediaUploadField
              label={t("dashboard.setup.profilePhotoLink")}
              value={config.brand.avatarUrl ?? ""}
              onChange={(value) =>
                onUpdate((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, avatarUrl: value },
                }))
              }
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("avatar", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="avatar"
            />
            <MediaUploadField
              label={t("dashboard.setup.coverUrl")}
              value={config.brand.coverUrl ?? ""}
              onChange={(value) =>
                onUpdate((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, coverUrl: value },
                }))
              }
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("cover", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="cover"
            />
            <MediaUploadField
              label={t("dashboard.setup.logoUrl")}
              value={config.brand.logoUrl ?? ""}
              onChange={(value) =>
                onUpdate((prev) => ({
                  ...prev,
                  brand: { ...prev.brand, logoUrl: value },
                }))
              }
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("logo", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="logo"
            />
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title={t("dashboard.setup.mainCopy")}>
          <div className="space-y-4">
            <Input
              label={t("dashboard.setup.homeTitle")}
              value={config.content.home.headline}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, headline: e.target.value },
                  },
                }))
              }
            />
            <Textarea
              label={t("dashboard.setup.homeSubtitle")}
              value={config.content.home.subheadline ?? ""}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, subheadline: e.target.value },
                  },
                }))
              }
            />
            <Input
              label={t("dashboard.setup.mainButtonText")}
              value={config.content.home.ctaLabel}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  content: {
                    ...prev.content,
                    home: { ...prev.content.home, ctaLabel: e.target.value },
                  },
                }))
              }
            />
          </div>
        </SectionCard>
      )}

      {step === 4 && (
        <SectionCard title={t("dashboard.setup.services")}>
          <p className="mb-4 text-sm text-slate-400">
            {t("dashboard.products.catalogSubtitle", {
              defaultValue:
                "Enable products from the platform catalog. Prices are read-only and set by the platform.",
            })}
          </p>
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
                    onChange={(checked) => toggleCatalogProduct(def.productType, checked)}
                  />
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}

      {step === 5 && (
        <SectionCard title={t("dashboard.setup.preview")}>
          <CompactPreview config={config} />
          <Link
            href={`/preview?tenantId=${tenantId}`}
            className="mt-4 inline-block text-sm text-violet-400 hover:underline"
          >
            {t("dashboard.setup.openFullPreview")}
          </Link>
        </SectionCard>
      )}

      <div className="flex justify-between">
        <Button type="button" variant="ghost" disabled={step === 0} onClick={handleBack}>
          {t("dashboard.setup.back")}
        </Button>
        <Button type="button" onClick={handleNext}>
          {step === SETUP_STEP_COUNT - 1 ? t("dashboard.setup.finish") : t("dashboard.setup.next")}
        </Button>
      </div>
    </div>
  );
}
