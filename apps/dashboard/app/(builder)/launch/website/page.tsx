"use client";

import {
  createDefaultMiniApp,
  ensureSurfaces,
  updateSurfaceInMiniApp,
} from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button, Input, SectionCard, Textarea } from "@astro/ui";
import { useDashboard } from "../../../components/DashboardProvider";
import type { WebsiteSurfaceConfig } from "@astro/tenant-config";

export default function LaunchWebsitePage() {
  const t = useT();
  const { config, updateConfig } = useDashboard();
  if (!config) return null;

  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const website = miniApp.surfaces?.find((s) => s.type === "website");
  const webConfig = (website?.configJson ?? {}) as WebsiteSurfaceConfig;

  function updateWebsite(patch: Partial<WebsiteSurfaceConfig>) {
    updateConfig((prev) => {
      const current = ensureSurfaces(prev.miniApp ?? createDefaultMiniApp(prev.slug), prev.slug);
      const surface = current.surfaces?.find((s) => s.type === "website");
      if (!surface) return prev;
      return {
        ...prev,
        miniApp: updateSurfaceInMiniApp(current, surface.id, {
          configJson: { ...webConfig, ...patch },
        }),
      };
    });
  }

  if (website?.status === "disabled") {
    return <p className="text-slate-400">{t("dashboard.launch.websiteDisabled")}</p>;
  }

  return (
    <SectionCard title={t("dashboard.launch.websiteTitle")} description={t("dashboard.launch.previewWebsiteContext")}>
      <div className="space-y-4">
        <Input
          label={t("dashboard.launch.publicSlug")}
          value={webConfig.slug ?? miniApp.publicSlug}
          onChange={(e) => updateWebsite({ slug: e.target.value })}
        />
        <Input
          label={t("dashboard.launch.seoTitle")}
          value={webConfig.seoTitle ?? config.brand.displayName}
          onChange={(e) => updateWebsite({ seoTitle: e.target.value })}
        />
        <Textarea
          label={t("dashboard.launch.seoDescription")}
          value={webConfig.seoDescription ?? config.content.home.subheadline ?? ""}
          onChange={(e) => updateWebsite({ seoDescription: e.target.value })}
        />
        <p className="text-sm text-slate-400">{website?.publicUrl}</p>
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigator.clipboard?.writeText(website?.publicUrl ?? "")}
        >
          {t("dashboard.launch.copyWebsiteLink")}
        </Button>
      </div>
    </SectionCard>
  );
}
