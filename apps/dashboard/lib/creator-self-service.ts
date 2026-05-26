import type { TenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  getSetupProgress,
  getSurfaceByType,
  isSurfaceEnabled,
  validateMiniAppPublish,
} from "@astro/tenant-config";

export type CreatorMainStatus =
  | "not_published"
  | "ready"
  | "published"
  | "needs_bot"
  | "error";

export type ChecklistItemState = "done" | "warning" | "missing";

export interface SelfServiceChecklistItem {
  id: string;
  labelKey: string;
  explanationKey: string;
  state: ChecklistItemState;
  href: string;
  visible: boolean;
}

export interface PublicLinkRow {
  id: string;
  labelKey: string;
  url: string;
  status: "draft" | "published" | "needs_bot";
}

export interface NextBestAction {
  labelKey: string;
  href: string;
  reasonKey?: string;
}

export const PREVIEW_VERIFIED_STORAGE_PREFIX = "astro:preview-verified:";

export function previewVerifiedStorageKey(tenantId: string): string {
  return `${PREVIEW_VERIFIED_STORAGE_PREFIX}${tenantId}`;
}

function isTelegramConnected(config: TenantConfig): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string } | undefined;
  return (
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured"
  );
}

export function resolveCreatorMainStatus(config: TenantConfig): CreatorMainStatus {
  if (config.miniApp?.publicStatus === "published") return "published";

  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const telegramEnabled = isSurfaceEnabled(miniApp, "telegram_mini_app");
  const validation = validateMiniAppPublish(config);
  const setup = getSetupProgress(config);

  if (!setup.brandAdded || !setup.surfacesSelected) return "not_published";

  if (validation.valid) return "ready";

  if (telegramEnabled && !isTelegramConnected(config)) {
    const onlyTelegram = validation.errors.every((e) => e.path.includes("telegram"));
    if (onlyTelegram) return "needs_bot";
  }

  if (!setup.brandAdded || !setup.surfacesSelected) return "not_published";

  if (telegramEnabled && !isTelegramConnected(config)) return "needs_bot";

  return "error";
}

export function resolveNextBestAction(
  config: TenantConfig,
  options: { isDirty?: boolean; previewVerified?: boolean } = {}
): NextBestAction {
  const { isDirty = false, previewVerified = false } = options;
  const status = resolveCreatorMainStatus(config);
  const setup = getSetupProgress(config);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const telegramEnabled = isSurfaceEnabled(miniApp, "telegram_mini_app");

  if (status === "published") {
    return { labelKey: "dashboard.controlCenter.actionCopyAllLinks", href: "overview#public-links" };
  }

  if (status === "needs_bot") {
    return {
      labelKey: "dashboard.controlCenter.actionConnectTelegram",
      href: "launch/telegram",
      reasonKey: "dashboard.launch.statusNeedsBot",
    };
  }

  if (status === "not_published" || status === "error") {
    if (!setup.brandAdded || !setup.mainTextConfigured) {
      return {
        labelKey: "dashboard.controlCenter.continueSetup",
        href: "launch/branding",
      };
    }
    if (!setup.visualPackSelected || !setup.designSelected) {
      return { labelKey: "dashboard.controlCenter.continueSetup", href: "launch/design" };
    }
    if (!setup.hasFreeReportActive || !setup.hasPaidProductActive) {
      return { labelKey: "dashboard.controlCenter.continueSetup", href: "launch/products" };
    }
    if (telegramEnabled && !isTelegramConnected(config)) {
      return {
        labelKey: "dashboard.controlCenter.actionConnectTelegram",
        href: "launch/telegram",
      };
    }
    return { labelKey: "dashboard.controlCenter.continueSetup", href: "launch/start" };
  }

  if (status === "ready") {
    if (isDirty) {
      return {
        labelKey: "dashboard.controlCenter.continueSetup",
        href: "launch/publish",
        reasonKey: "dashboard.layout.unsavedChanges",
      };
    }
    if (!previewVerified) {
      return {
        labelKey: "dashboard.controlCenter.actionPreview",
        href: "preview",
        reasonKey: "dashboard.launch.checklistPreview",
      };
    }
    return { labelKey: "dashboard.controlCenter.publish", href: "launch/publish" };
  }

  return { labelKey: "dashboard.controlCenter.continueSetup", href: "launch/start" };
}

function brandDone(setup: ReturnType<typeof getSetupProgress>): boolean {
  return setup.brandAdded && setup.mainTextConfigured;
}

function designDone(setup: ReturnType<typeof getSetupProgress>): boolean {
  return setup.visualPackSelected && setup.designSelected;
}

function productsDone(setup: ReturnType<typeof getSetupProgress>): boolean {
  return setup.hasFreeReportActive && setup.hasPaidProductActive;
}

function websiteReady(config: TenantConfig, setup: ReturnType<typeof getSetupProgress>): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  if (!isSurfaceEnabled(miniApp, "website")) return false;
  return setup.miniAppSlugConfigured;
}

function mobileReady(config: TenantConfig, setup: ReturnType<typeof getSetupProgress>): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  if (!isSurfaceEnabled(miniApp, "mobile_web")) return false;
  return setup.miniAppSlugConfigured;
}

export function buildSelfServiceChecklist(
  config: TenantConfig,
  previewVerified = false
): SelfServiceChecklistItem[] {
  const setup = getSetupProgress(config);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const websiteEnabled = isSurfaceEnabled(miniApp, "website");
  const mobileEnabled = isSurfaceEnabled(miniApp, "mobile_web");
  const telegramEnabled = isSurfaceEnabled(miniApp, "telegram_mini_app");
  const telegramConnected = isTelegramConnected(config);
  const isPublished = config.miniApp?.publicStatus === "published";

  const items: SelfServiceChecklistItem[] = [
    {
      id: "brand",
      labelKey: "dashboard.launch.checklistName",
      explanationKey: "dashboard.controlCenter.checklistExplainName",
      state: brandDone(setup) ? "done" : "missing",
      href: "launch/branding",
      visible: true,
    },
    {
      id: "design",
      labelKey: "dashboard.launch.checklistDesign",
      explanationKey: "dashboard.controlCenter.checklistExplainDesign",
      state: designDone(setup) ? "done" : "missing",
      href: "launch/design",
      visible: true,
    },
    {
      id: "products",
      labelKey: "dashboard.launch.checklistProducts",
      explanationKey: "dashboard.controlCenter.checklistExplainProducts",
      state: productsDone(setup) ? "done" : "missing",
      href: "launch/products",
      visible: true,
    },
    {
      id: "website",
      labelKey: "dashboard.launch.checklistWebsite",
      explanationKey: "dashboard.controlCenter.checklistExplainWebsite",
      state: websiteReady(config, setup) ? "done" : websiteEnabled ? "missing" : "missing",
      href: "launch/website",
      visible: websiteEnabled,
    },
    {
      id: "mobile",
      labelKey: "dashboard.launch.checklistMobile",
      explanationKey: "dashboard.controlCenter.checklistExplainMobile",
      state: mobileReady(config, setup) ? "done" : mobileEnabled ? "missing" : "missing",
      href: "launch/mobile",
      visible: mobileEnabled,
    },
    {
      id: "telegram",
      labelKey: "dashboard.launch.checklistTelegram",
      explanationKey: "dashboard.controlCenter.checklistExplainTelegram",
      state: telegramConnected ? "done" : telegramEnabled ? "warning" : "missing",
      href: "launch/telegram",
      visible: telegramEnabled,
    },
    {
      id: "preview",
      labelKey: "dashboard.launch.checklistPreview",
      explanationKey: "dashboard.controlCenter.checklistExplainPreview",
      state: previewVerified ? "done" : "missing",
      href: "preview",
      visible: true,
    },
    {
      id: "published",
      labelKey: "dashboard.launch.checklistPublished",
      explanationKey: "dashboard.controlCenter.checklistExplainPublished",
      state: isPublished ? "done" : "missing",
      href: "launch/publish",
      visible: true,
    },
  ];

  return items.filter((item) => item.visible);
}

export function buildPublicLinks(
  config: TenantConfig,
  baseUrl = process.env.NEXT_PUBLIC_MINIAPP_URL ?? "http://localhost:3000"
): PublicLinkRow[] {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const isPublished = config.miniApp?.publicStatus === "published";
  const websiteSurface = getSurfaceByType(miniApp, "website");
  const mobileSurface = getSurfaceByType(miniApp, "mobile_web");
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as {
    deepLink?: string;
    botUsername?: string;
    botStatus?: string;
  } | undefined;
  const telegramConnected =
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured";

  const linkStatus = (
    surfacePublished: boolean,
    needsBot = false
  ): PublicLinkRow["status"] => {
    if (needsBot) return "needs_bot";
    if (surfacePublished && isPublished) return "published";
    return "draft";
  };

  const rows: PublicLinkRow[] = [];

  if (websiteSurface?.status !== "disabled") {
    rows.push({
      id: "website",
      labelKey: "dashboard.controlCenter.websiteLink",
      url: `${baseUrl}${websiteSurface?.publicUrl ?? `/s/${miniApp.publicSlug}`}`,
      status: linkStatus(true),
    });
  }

  if (mobileSurface?.status !== "disabled") {
    rows.push({
      id: "mobile",
      labelKey: "dashboard.controlCenter.mobileLink",
      url: `${baseUrl}${mobileSurface?.publicUrl ?? `/m/${miniApp.publicSlug}`}`,
      status: linkStatus(true),
    });
  }

  if (isSurfaceEnabled(miniApp, "telegram_mini_app")) {
    rows.push({
      id: "telegram",
      labelKey: "dashboard.controlCenter.telegramLink",
      url: tgConfig?.deepLink?.startsWith("http")
        ? tgConfig.deepLink
        : tgConfig?.botUsername
          ? `https://t.me/${tgConfig.botUsername.replace("@", "")}`
          : `${baseUrl}/b/${miniApp.publicSlug}`,
      status: linkStatus(Boolean(tgConfig?.deepLink), !telegramConnected),
    });
  }

  return rows;
}

export function formatAllLinksText(
  links: PublicLinkRow[],
  labelFn: (labelKey: string) => string
): string {
  return links.map((link) => `${labelFn(link.labelKey)}: ${link.url}`).join("\n");
}

export function mainStatusHeadlineKey(status: CreatorMainStatus): string {
  switch (status) {
    case "published":
      return "dashboard.controlCenter.statusPublished";
    case "ready":
      return "dashboard.controlCenter.statusReady";
    case "needs_bot":
      return "dashboard.controlCenter.statusNeedsBot";
    case "error":
      return "dashboard.controlCenter.statusError";
    default:
      return "dashboard.controlCenter.statusNotPublished";
  }
}
