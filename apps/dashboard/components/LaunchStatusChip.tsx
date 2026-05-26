"use client";

import type { TenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  getSetupProgress,
  getSurfaceByType,
  isSurfaceEnabled,
  validateMiniAppPublish,
} from "@astro/tenant-config";
import { Badge } from "@astro/ui";
import { useT } from "@astro/i18n";

type LaunchStatus = "draft" | "ready" | "published" | "needs_bot" | "error";

function resolveLaunchStatus(config: TenantConfig): LaunchStatus {
  const miniApp = config.miniApp;
  if (miniApp?.publicStatus === "published") return "published";

  const ensured = ensureSurfaces(miniApp, config.slug);
  const telegramEnabled = isSurfaceEnabled(ensured, "telegram_mini_app");
  const tgSurface = getSurfaceByType(ensured, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string } | undefined;
  const telegramConnected =
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured";

  if (telegramEnabled && !telegramConnected) return "needs_bot";

  const validation = validateMiniAppPublish(config);
  if (!validation.valid) {
    const onlyTelegram = validation.errors.every((e) => e.path.includes("telegram"));
    if (onlyTelegram && telegramEnabled) return "needs_bot";
    return "error";
  }

  const setup = getSetupProgress(config);
  if (setup.previewChecked) return "ready";
  return "draft";
}

const STATUS_VARIANT: Record<LaunchStatus, "neutral" | "success" | "warning" | "info" | "error"> = {
  draft: "neutral",
  ready: "info",
  published: "success",
  needs_bot: "warning",
  error: "error",
};

export function LaunchStatusChip({ config }: { config: TenantConfig }) {
  const t = useT();
  const status = resolveLaunchStatus(config);
  const labels: Record<LaunchStatus, string> = {
    draft: t("dashboard.launch.statusDraft"),
    ready: t("dashboard.launch.statusReady"),
    published: t("dashboard.launch.statusPublished"),
    needs_bot: t("dashboard.launch.statusNeedsBot"),
    error: t("dashboard.launch.statusError"),
  };
  return <Badge variant={STATUS_VARIANT[status]}>{labels[status]}</Badge>;
}
