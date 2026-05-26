import type { TenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  getSetupProgress,
  getSurfaceByType,
  isSurfaceEnabled,
} from "@astro/tenant-config";

export type LaunchProgressState = "done" | "warning" | "missing";

export interface LaunchProgressStep {
  id: string;
  labelKey: string;
  state: LaunchProgressState;
  href?: string;
  /** When false, step is omitted from progress UI (e.g. Telegram when disabled). */
  visible: boolean;
}

function isTelegramConnected(config: TenantConfig): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string } | undefined;
  return (
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured"
  );
}

function isMobileWebReady(config: TenantConfig, setup: ReturnType<typeof getSetupProgress>): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  if (!isSurfaceEnabled(miniApp, "mobile_web")) return false;
  return setup.miniAppSlugConfigured;
}

function isWebsiteReady(config: TenantConfig, setup: ReturnType<typeof getSetupProgress>): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  if (!isSurfaceEnabled(miniApp, "website")) return false;
  return setup.miniAppSlugConfigured;
}

export function buildLaunchProgressSteps(config: TenantConfig): LaunchProgressStep[] {
  const setup = getSetupProgress(config);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const websiteEnabled = isSurfaceEnabled(miniApp, "website");
  const mobileEnabled = isSurfaceEnabled(miniApp, "mobile_web");
  const telegramEnabled = isSurfaceEnabled(miniApp, "telegram_mini_app");
  const telegramConnected = isTelegramConnected(config);
  const isPublished = config.miniApp?.publicStatus === "published";

  const brandDone = setup.brandAdded && setup.mainTextConfigured;
  const designDone = setup.visualPackSelected && setup.designSelected;
  const productsDone = setup.hasFreeReportActive && setup.hasPaidProductActive;

  const steps: LaunchProgressStep[] = [
    {
      id: "surfaces",
      labelKey: "dashboard.launch.progressSurfaces",
      state: setup.surfacesSelected ? "done" : "missing",
      href: "start",
      visible: true,
    },
    {
      id: "brand",
      labelKey: "dashboard.launch.progressBrand",
      state: brandDone ? "done" : "missing",
      href: "branding",
      visible: true,
    },
    {
      id: "design",
      labelKey: "dashboard.launch.progressDesign",
      state: designDone ? "done" : "missing",
      href: "design",
      visible: true,
    },
    {
      id: "products",
      labelKey: "dashboard.launch.progressProducts",
      state: productsDone ? "done" : "missing",
      href: "products",
      visible: true,
    },
    {
      id: "website",
      labelKey: "dashboard.launch.checklistWebsite",
      state: isWebsiteReady(config, setup) ? "done" : websiteEnabled ? "missing" : "missing",
      href: "website",
      visible: websiteEnabled,
    },
    {
      id: "mobile",
      labelKey: "dashboard.launch.checklistMobile",
      state: isMobileWebReady(config, setup) ? "done" : mobileEnabled ? "missing" : "missing",
      href: "mobile",
      visible: mobileEnabled,
    },
    {
      id: "telegram",
      labelKey: "dashboard.launch.checklistTelegram",
      state: telegramConnected ? "done" : "warning",
      href: "telegram",
      visible: telegramEnabled,
    },
    {
      id: "published",
      labelKey: "dashboard.launch.progressPublished",
      state: isPublished ? "done" : "missing",
      href: "publish",
      visible: true,
    },
  ];

  return steps.filter((s) => s.visible);
}

export function getLaunchProgressPercent(steps: LaunchProgressStep[]): number {
  if (steps.length === 0) return 0;
  const done = steps.filter((s) => s.state === "done").length;
  return Math.round((done / steps.length) * 100);
}

export function getStepCompletionState(
  stepHref: string,
  config: TenantConfig
): LaunchProgressState | null {
  const step = buildLaunchProgressSteps(config).find((s) => s.href === stepHref);
  return step?.state ?? null;
}
