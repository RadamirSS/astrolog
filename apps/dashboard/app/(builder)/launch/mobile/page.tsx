"use client";

import {
  createDefaultMiniApp,
  ensureSurfaces,
  updateSurfaceInMiniApp,
} from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { Button, SectionCard, Toggle } from "@astro/ui";
import { useDashboard } from "../../../components/DashboardProvider";
import type { MobileWebSurfaceConfig } from "@astro/tenant-config";

export default function LaunchMobilePage() {
  const t = useT();
  const { config, updateConfig } = useDashboard();
  if (!config) return null;

  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const mobile = miniApp.surfaces?.find((s) => s.type === "mobile_web");
  const mobileConfig = (mobile?.configJson ?? {}) as MobileWebSurfaceConfig;

  function updateMobile(patch: Partial<MobileWebSurfaceConfig>) {
    updateConfig((prev) => {
      const current = ensureSurfaces(prev.miniApp ?? createDefaultMiniApp(prev.slug), prev.slug);
      const surface = current.surfaces?.find((s) => s.type === "mobile_web");
      if (!surface) return prev;
      return {
        ...prev,
        miniApp: updateSurfaceInMiniApp(current, surface.id, {
          configJson: { ...mobileConfig, ...patch },
        }),
      };
    });
  }

  if (mobile?.status === "disabled") {
    return <p className="text-slate-400">{t("dashboard.launch.mobileDisabled")}</p>;
  }

  return (
    <SectionCard title={t("dashboard.launch.mobileTitle")} description={t("dashboard.launch.mobileDesc")}>
      <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-950/30 px-4 py-3 text-sm text-violet-100">
        {t("dashboard.launch.mobileCallout")}
      </div>
      <div className="space-y-4">
        <p className="text-sm text-slate-300">{mobile?.publicUrl}</p>
        <Toggle
          label={t("dashboard.launch.bottomNav")}
          checked={mobileConfig.bottomNavEnabled ?? true}
          onChange={(checked) => updateMobile({ bottomNavEnabled: checked })}
        />
        <Toggle
          label={t("dashboard.launch.installHint")}
          checked={mobileConfig.installableHintEnabled ?? true}
          onChange={(checked) => updateMobile({ installableHintEnabled: checked })}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => navigator.clipboard?.writeText(mobile?.publicUrl ?? "")}
        >
          {t("dashboard.launch.copyMobileLink")}
        </Button>
      </div>
    </SectionCard>
  );
}
