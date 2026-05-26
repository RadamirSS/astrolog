"use client";

import { FormActions, Input, MediaUploadField, SectionCard, Textarea } from "@astro/ui";
import { getApiMode, uploadTenantMedia } from "@astro/api-client";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../../components/DashboardProvider";
import { useFieldValidation } from "../../../../hooks/useFieldValidation";

export default function LaunchBrandingPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const { getError } = useFieldValidation(config);
  const isRemote = getApiMode() === "remote";

  async function uploadBrandMedia(kind: "avatar" | "logo" | "cover", file: File) {
    const asset = await uploadTenantMedia(tenantId, file, kind);
    return asset.publicUrl;
  }

  if (loading || !config) return <p className="text-slate-400">{t("dashboard.brand.loading")}</p>;

  function updateBrand(field: string, value: string) {
    updateConfig((prev) => ({
      ...prev,
      brand: { ...prev.brand, [field]: value },
    }));
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t("dashboard.brand.identity", { defaultValue: "App identity" })}>
        <div className="grid gap-4">
          <Input
            label={t("dashboard.brand.displayName")}
            value={config.brand.displayName}
            onChange={(e) => updateBrand("displayName", e.target.value)}
            error={getError("brand.displayName")}
          />
          <Input
            label={t("dashboard.brand.tagline", { defaultValue: "Tagline" })}
            value={config.brand.tagline ?? ""}
            onChange={(e) => updateBrand("tagline", e.target.value)}
          />
          <Textarea
            label={t("dashboard.brand.bio", { defaultValue: "Short bio" })}
            value={config.brand.bio ?? ""}
            onChange={(e) => updateBrand("bio", e.target.value)}
          />
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.brand.media", { defaultValue: "Media" })}>
        <div className="grid gap-4 sm:grid-cols-3">
          <MediaUploadField
            label={t("dashboard.brand.avatar")}
            previewVariant="avatar"
            value={config.brand.avatarUrl}
            onUpload={isRemote ? (file) => uploadBrandMedia("avatar", file) : undefined}
            onChange={(url) => updateBrand("avatarUrl", url)}
          />
          <MediaUploadField
            label={t("dashboard.brand.logo", { defaultValue: "Logo" })}
            previewVariant="logo"
            value={config.brand.logoUrl}
            onUpload={isRemote ? (file) => uploadBrandMedia("logo", file) : undefined}
            onChange={(url) => updateBrand("logoUrl", url)}
          />
          <MediaUploadField
            label={t("dashboard.brand.cover", { defaultValue: "Cover" })}
            previewVariant="cover"
            value={config.brand.coverUrl}
            onUpload={isRemote ? (file) => uploadBrandMedia("cover", file) : undefined}
            onChange={(url) => updateBrand("coverUrl", url)}
          />
        </div>
      </SectionCard>

      <SectionCard title={t("dashboard.content.homeCopy", { defaultValue: "Hero copy" })}>
        <div className="grid gap-4">
          <Input
            label={t("dashboard.content.headline")}
            value={config.content.home.headline}
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                content: {
                  ...prev.content,
                  home: { ...prev.content.home, headline: e.target.value },
                },
              }))
            }
          />
          <Input
            label={t("dashboard.content.subheadline", { defaultValue: "Subheadline" })}
            value={config.content.home.subheadline ?? ""}
            onChange={(e) =>
              updateConfig((prev) => ({
                ...prev,
                content: {
                  ...prev.content,
                  home: { ...prev.content.home, subheadline: e.target.value },
                },
              }))
            }
          />
          <Input
            label={t("dashboard.content.ctaLabel", { defaultValue: "CTA text" })}
            value={config.content.home.ctaLabel}
            onChange={(e) =>
              updateConfig((prev) => ({
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

      <FormActions onSave={saveDraft} onReset={resetToSaved} saving={saving} isDirty={isDirty} />
    </div>
  );
}
