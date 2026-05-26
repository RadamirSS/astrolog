"use client";

import {
  ensureSurfaces,
  getSurfaceByType,
  setSurfaceEnabled,
  type SurfaceType,
} from "@astro/tenant-config";
import { useT } from "@astro/i18n";
import { SectionCard } from "@astro/ui";
import { useDashboard } from "../../../components/DashboardProvider";
import { SurfaceSelectionCard } from "../../../../components/SurfaceSelectionCard";

const SURFACE_INFO: {
  type: SurfaceType;
  titleKey: string;
  descKey: string;
  bestForKey: string;
  recommended?: boolean;
  extraBadges?: string[];
}[] = [
  {
    type: "website",
    titleKey: "dashboard.launch.surfaceWebsiteTitle",
    descKey: "dashboard.launch.surfaceWebsiteDesc",
    bestForKey: "dashboard.launch.surfaceWebsiteBestFor",
    recommended: true,
    extraBadges: ["dashboard.launch.surfaceBadgeAds"],
  },
  {
    type: "mobile_web",
    titleKey: "dashboard.launch.surfaceMobileTitle",
    descKey: "dashboard.launch.surfaceMobileDesc",
    bestForKey: "dashboard.launch.surfaceMobileBestFor",
    extraBadges: ["dashboard.launch.surfaceBadgeMobile", "dashboard.launch.surfaceBadgeFastLaunch"],
  },
  {
    type: "telegram_mini_app",
    titleKey: "dashboard.launch.surfaceTelegramTitle",
    descKey: "dashboard.launch.surfaceTelegramDesc",
    bestForKey: "dashboard.launch.surfaceTelegramBestFor",
    extraBadges: ["dashboard.launch.surfaceBadgeTelegram", "dashboard.launch.surfaceBadgeBotRequired"],
  },
];

function resolveSurfaceStatus(
  type: SurfaceType,
  enabled: boolean,
  miniApp: ReturnType<typeof ensureSurfaces>
): "disabled" | "enabled" | "needs_bot" | "ready" {
  if (!enabled) return "disabled";
  if (type === "telegram_mini_app") {
    const tg = getSurfaceByType(miniApp, "telegram_mini_app");
    const botStatus = (tg?.configJson as { botStatus?: string } | undefined)?.botStatus;
    if (botStatus === "connected" || botStatus === "webhook_configured") return "ready";
    return "needs_bot";
  }
  return "enabled";
}

export default function LaunchStartPage() {
  const t = useT();
  const { config, updateConfig } = useDashboard();
  if (!config) return null;

  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const enabledCount = (miniApp.surfaces ?? []).filter((s) => s.status !== "disabled").length;

  function toggleSurface(type: SurfaceType) {
    updateConfig((prev) => {
      const current = ensureSurfaces(prev.miniApp, prev.slug);
      const enabled = isEnabled(type);
      return {
        ...prev,
        miniApp: setSurfaceEnabled(current, type, !enabled),
      };
    });
  }

  function isEnabled(type: SurfaceType): boolean {
    const surface = miniApp.surfaces?.find((s) => s.type === type);
    return Boolean(surface && surface.status !== "disabled");
  }

  return (
    <SectionCard title={t("dashboard.launch.startTitle")} description={t("dashboard.launch.startDesc")}>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {SURFACE_INFO.map((item) => {
          const enabled = isEnabled(item.type);
          return (
            <SurfaceSelectionCard
              key={item.type}
              type={item.type}
              titleKey={item.titleKey}
              descKey={item.descKey}
              bestForKey={item.bestForKey}
              enabled={enabled}
              recommended={item.recommended}
              extraBadges={item.extraBadges}
              status={resolveSurfaceStatus(item.type, enabled, miniApp)}
              onToggle={() => toggleSurface(item.type)}
            />
          );
        })}
      </div>
      {enabledCount === 0 && (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          {t("dashboard.launch.startNoSurfaces")}
        </p>
      )}
      <p className="mt-4 text-xs text-slate-500">{t("dashboard.launch.startHint")}</p>
    </SectionCard>
  );
}
