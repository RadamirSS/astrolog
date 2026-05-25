"use client";

import { FormActions, Input, MediaUploadField, SectionCard, Textarea } from "@astro/ui";
import { getApiMode, uploadTenantMedia } from "@astro/api-client";
import { useT } from "@astro/i18n";
import { useDashboard } from "../../components/DashboardProvider";
import { EditorLayout } from "../../../components/EditorLayout";
import { useFieldValidation } from "../../../hooks/useFieldValidation";
import { useDashboardAnalytics } from "../../../lib/useDashboardAnalytics";

export default function BrandPage() {
  const t = useT();
  const { config, loading, updateConfig, saveDraft, resetToSaved, saving, isDirty, tenantId } =
    useDashboard();
  const { getError } = useFieldValidation(config);
  const track = useDashboardAnalytics(tenantId, config?.slug);
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
      <div>
        <h1 className="text-2xl font-semibold">{t("dashboard.brand.title")}</h1>
        <p className="text-slate-400">{t("dashboard.brand.subtitle")}</p>
      </div>

      <EditorLayout config={config}>
        <SectionCard title={t("dashboard.brand.brandDetails")}>
          <div className="space-y-4">
            <Input
              label={t("dashboard.brand.brandName")}
              value={config.brand.name ?? ""}
              onChange={(e) => updateBrand("name", e.target.value)}
            />
            <Input
              label={t("dashboard.brand.displayName")}
              value={config.brand.displayName}
              error={getError("brand.displayName")}
              onChange={(e) => updateBrand("displayName", e.target.value)}
            />
            <Input
              label={t("dashboard.brand.tagline")}
              value={config.brand.tagline ?? ""}
              onChange={(e) => updateBrand("tagline", e.target.value)}
            />
            <Textarea
              label={t("dashboard.brand.bio")}
              value={config.brand.bio ?? ""}
              onChange={(e) => updateBrand("bio", e.target.value)}
            />
            <MediaUploadField
              label={t("dashboard.brand.profilePhotoLink")}
              value={config.brand.avatarUrl ?? ""}
              error={getError("brand.avatarUrl")}
              onChange={(value) => updateBrand("avatarUrl", value)}
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("avatar", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="avatar"
            />
            <MediaUploadField
              label={t("dashboard.brand.logoLink")}
              value={config.brand.logoUrl ?? ""}
              error={getError("brand.logoUrl")}
              onChange={(value) => updateBrand("logoUrl", value)}
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("logo", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="logo"
            />
            <MediaUploadField
              label={t("dashboard.brand.coverImageLink")}
              value={config.brand.coverUrl ?? ""}
              error={getError("brand.coverUrl")}
              onChange={(value) => updateBrand("coverUrl", value)}
              showUpload={isRemote}
              onUpload={(file) => uploadBrandMedia("cover", file)}
              urlLabel={t("dashboard.brand.urlFallback")}
              previewVariant="cover"
            />
            <Input
              label={t("dashboard.brand.telegramUsername")}
              placeholder="@yourname"
              value={config.brand.telegramUsername ?? ""}
              onChange={(e) => updateBrand("telegramUsername", e.target.value)}
            />
            <Input
              label={t("dashboard.brand.instagramUrl")}
              value={config.brand.instagramUrl ?? ""}
              error={getError("brand.instagramUrl")}
              onChange={(e) => updateBrand("instagramUrl", e.target.value)}
            />
            <Input
              label={t("dashboard.brand.supportEmail")}
              type="email"
              value={config.brand.supportEmail ?? ""}
              onChange={(e) => updateBrand("supportEmail", e.target.value)}
            />
          </div>
          <FormActions
            onSave={async () => {
              await saveDraft();
              track("dashboard_brand_saved");
            }}
            onReset={resetToSaved}
            saving={saving}
            isDirty={isDirty}
            saveLabel={t("ui.saveChanges")}
            resetLabel={t("ui.resetToSaved")}
          />
        </SectionCard>
      </EditorLayout>
    </div>
  );
}
