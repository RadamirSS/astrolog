import type { TenantConfig } from "@astro/tenant-config";
import {
  ensureSurfaces,
  getSetupProgress,
  getSurfaceByType,
  isSurfaceEnabled,
  validateMiniAppPublish,
  type FieldError,
} from "@astro/tenant-config";
import { buildPublicLinks, type PublicLinkRow } from "./creator-self-service";

export type PublishReadinessTier = "ready" | "attention" | "blocked";

export interface PublishSurfaceRow {
  id: string;
  labelKey: string;
  enabled: boolean;
  ready: boolean;
  url: string;
  status: PublicLinkRow["status"];
}

export interface PublishReadinessSummary {
  tier: PublishReadinessTier;
  headlineKey: string;
  descriptionKey: string;
  canPublish: boolean;
  blockers: FieldError[];
  surfaces: PublishSurfaceRow[];
  links: PublicLinkRow[];
}

function isTelegramConnected(config: TenantConfig): boolean {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig = tgSurface?.configJson as { botStatus?: string } | undefined;
  return (
    tgConfig?.botStatus === "connected" || tgConfig?.botStatus === "webhook_configured"
  );
}

function surfaceReady(
  config: TenantConfig,
  surfaceId: "website" | "mobile_web" | "telegram_mini_app"
): boolean {
  const setup = getSetupProgress(config);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);

  if (surfaceId === "telegram_mini_app") {
    return isTelegramConnected(config);
  }

  if (!isSurfaceEnabled(miniApp, surfaceId)) return false;
  return setup.miniAppSlugConfigured;
}

export function getPublishReadiness(
  config: TenantConfig,
  options: { isDirty?: boolean } = {}
): PublishReadinessSummary {
  const { isDirty = false } = options;
  const validation = validateMiniAppPublish(config);
  const links = buildPublicLinks(config);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);

  const surfaces: PublishSurfaceRow[] = [
    {
      id: "website",
      labelKey: "dashboard.controlCenter.websiteLink",
      enabled: isSurfaceEnabled(miniApp, "website"),
      ready: surfaceReady(config, "website"),
      url: links.find((l) => l.id === "website")?.url ?? "",
      status: links.find((l) => l.id === "website")?.status ?? "draft",
    },
    {
      id: "mobile",
      labelKey: "dashboard.controlCenter.mobileLink",
      enabled: isSurfaceEnabled(miniApp, "mobile_web"),
      ready: surfaceReady(config, "mobile_web"),
      url: links.find((l) => l.id === "mobile")?.url ?? "",
      status: links.find((l) => l.id === "mobile")?.status ?? "draft",
    },
    {
      id: "telegram",
      labelKey: "dashboard.controlCenter.telegramLink",
      enabled: isSurfaceEnabled(miniApp, "telegram_mini_app"),
      ready: surfaceReady(config, "telegram_mini_app"),
      url: links.find((l) => l.id === "telegram")?.url ?? "",
      status: links.find((l) => l.id === "telegram")?.status ?? "draft",
    },
  ];

  const blockers = validation.errors;
  const hasRequiredSurfaceIssues = surfaces.some((s) => s.enabled && !s.ready);

  let tier: PublishReadinessTier = "ready";
  let headlineKey = "dashboard.publish.readinessReady";
  let descriptionKey = "dashboard.publish.readinessReadyDesc";

  if (!validation.valid || hasRequiredSurfaceIssues) {
    tier = "blocked";
    headlineKey = "dashboard.publish.readinessBlocked";
    descriptionKey = "dashboard.publish.readinessBlockedDesc";
  } else if (isDirty) {
    tier = "attention";
    headlineKey = "dashboard.publish.readinessAttention";
    descriptionKey = "dashboard.publish.readinessAttentionDesc";
  }

  return {
    tier,
    headlineKey,
    descriptionKey,
    canPublish: validation.valid && !isDirty,
    blockers,
    surfaces,
    links,
  };
}

export const PUBLISH_CHECKLIST_HREFS: Record<string, string> = {
  brand: "launch/branding",
  design: "launch/design",
  content: "launch/branding",
  freeReport: "launch/products",
  paidProduct: "launch/products",
  publicSlug: "launch/website",
  products: "launch/products",
  website: "launch/website",
  mobile: "launch/mobile",
  telegram: "launch/telegram",
  saved: "launch/publish",
  published: "launch/publish",
  changes: "launch/publish",
};
