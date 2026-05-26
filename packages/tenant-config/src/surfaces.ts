import type {
  CreatorMiniAppConfig,
  MiniAppConfig,
  SurfaceConfig,
  SurfaceStatus,
  SurfaceType,
  TelegramSurfaceConfig,
  WebsiteSurfaceConfig,
  MobileWebSurfaceConfig,
} from "./types";

export const SURFACE_TYPES: SurfaceType[] = [
  "telegram_mini_app",
  "website",
  "mobile_web",
];

export const REFERENCE_VISUAL_PACKS = [
  "sky_clarity",
  "dark_gold_mystic",
  "pink_love",
  "cosmic_pastel",
] as const;

function surfaceId(type: SurfaceType): string {
  return `surface_${type}`;
}

function defaultTelegramConfig(slug: string): TelegramSurfaceConfig {
  return {
    botStatus: "not_connected",
    miniAppUrl: `/b/${slug}`,
    deepLink: `https://t.me/your_bot?startapp=${slug}`,
  };
}

function defaultWebsiteConfig(slug: string): WebsiteSurfaceConfig {
  return {
    slug,
    publicUrl: `/s/${slug}`,
    previewUrl: `/s/${slug}?preview=draft`,
    status: "draft",
  };
}

function defaultMobileConfig(slug: string): MobileWebSurfaceConfig {
  return {
    publicUrl: `/m/${slug}`,
    installableHintEnabled: true,
    bottomNavEnabled: true,
    status: "draft",
  };
}

export function buildSurfacePublicUrls(slug: string, baseUrl = ""): Record<SurfaceType, string> {
  const prefix = baseUrl.replace(/\/$/, "");
  return {
    telegram_mini_app: `${prefix}/b/${slug}`,
    website: `${prefix}/s/${slug}`,
    mobile_web: `${prefix}/m/${slug}`,
  };
}

export function createDefaultSurface(type: SurfaceType, slug: string): SurfaceConfig {
  const now = new Date().toISOString();
  const urls = buildSurfacePublicUrls(slug);
  const configJson =
    type === "telegram_mini_app"
      ? defaultTelegramConfig(slug)
      : type === "website"
        ? defaultWebsiteConfig(slug)
        : defaultMobileConfig(slug);

  return {
    id: surfaceId(type),
    type,
    status: type === "telegram_mini_app" ? "disabled" : "draft",
    publicUrl: urls[type],
    previewUrl:
      type === "website"
        ? `${urls.website}?preview=draft`
        : type === "mobile_web"
          ? `${urls.mobile_web}?preview=draft`
          : `${urls.telegram_mini_app}?preview=draft`,
    configJson,
    createdAt: now,
    updatedAt: now,
  };
}

export function createDefaultSurfaces(slug: string): SurfaceConfig[] {
  return SURFACE_TYPES.map((type) => createDefaultSurface(type, slug));
}

export function ensureSurfaces(
  miniApp: CreatorMiniAppConfig | MiniAppConfig | undefined,
  slug: string
): CreatorMiniAppConfig {
  const base: CreatorMiniAppConfig = {
    ...(miniApp ?? { publicSlug: slug, visualPack: "cosmic_pastel", defaultTopic: null, publicStatus: "draft" }),
    publicSlug: miniApp?.publicSlug ?? slug,
  };

  if (base.surfaces && base.surfaces.length > 0) {
    return syncSurfaceUrls(base, base.publicSlug);
  }

  const surfaces = createDefaultSurfaces(base.publicSlug);
  if (base.publicStatus === "published") {
    for (const surface of surfaces) {
      if (surface.status !== "disabled") {
        surface.status = "configured";
      }
    }
  }

  return { ...base, surfaces };
}

export function syncSurfaceUrls(
  miniApp: CreatorMiniAppConfig,
  slug?: string
): CreatorMiniAppConfig {
  const publicSlug = slug ?? miniApp.publicSlug;
  const urls = buildSurfacePublicUrls(publicSlug);
  const surfaces = (miniApp.surfaces ?? createDefaultSurfaces(publicSlug)).map((surface) => {
    const configJson = { ...surface.configJson };
    if (surface.type === "telegram_mini_app") {
      const tg = configJson as TelegramSurfaceConfig;
      tg.miniAppUrl = urls.telegram_mini_app;
      if (tg.botUsername) {
        tg.deepLink = `https://t.me/${tg.botUsername}?startapp=${publicSlug}`;
      }
    }
    if (surface.type === "website") {
      const web = configJson as WebsiteSurfaceConfig;
      web.slug = publicSlug;
      web.publicUrl = urls.website;
      web.previewUrl = `${urls.website}?preview=draft`;
    }
    if (surface.type === "mobile_web") {
      const mobile = configJson as MobileWebSurfaceConfig;
      mobile.publicUrl = urls.mobile_web;
    }
    return {
      ...surface,
      publicUrl: urls[surface.type],
      previewUrl:
        surface.type === "website"
          ? `${urls.website}?preview=draft`
          : surface.type === "mobile_web"
            ? `${urls.mobile_web}?preview=draft`
            : `${urls.telegram_mini_app}?preview=draft`,
      configJson,
    };
  });
  return { ...miniApp, publicSlug, surfaces };
}

export function getEnabledSurfaces(miniApp: CreatorMiniAppConfig | undefined): SurfaceConfig[] {
  if (!miniApp?.surfaces) return [];
  return miniApp.surfaces.filter((s) => s.status !== "disabled");
}

export function getSurfaceByType(
  miniApp: CreatorMiniAppConfig | undefined,
  type: SurfaceType
): SurfaceConfig | undefined {
  return ensureSurfaces(miniApp, miniApp?.publicSlug ?? "").surfaces?.find((s) => s.type === type);
}

export function isSurfaceEnabled(
  miniApp: CreatorMiniAppConfig | undefined,
  type: SurfaceType
): boolean {
  const surface = getSurfaceByType(miniApp, type);
  return Boolean(surface && surface.status !== "disabled");
}

export function updateSurfaceInMiniApp(
  miniApp: CreatorMiniAppConfig,
  surfaceId: string,
  patch: Partial<SurfaceConfig>
): CreatorMiniAppConfig {
  const surfaces = (miniApp.surfaces ?? createDefaultSurfaces(miniApp.publicSlug)).map((s) =>
    s.id === surfaceId
      ? {
          ...s,
          ...patch,
          configJson: patch.configJson ? { ...s.configJson, ...patch.configJson } : s.configJson,
          updatedAt: new Date().toISOString(),
        }
      : s
  );
  return syncSurfaceUrls({ ...miniApp, surfaces });
}

export function setSurfaceEnabled(
  miniApp: CreatorMiniAppConfig,
  type: SurfaceType,
  enabled: boolean
): CreatorMiniAppConfig {
  const ensured = ensureSurfaces(miniApp, miniApp.publicSlug);
  const surfaces = ensured.surfaces!.map((s) =>
    s.type === type
      ? {
          ...s,
          status: (enabled
            ? s.status === "disabled"
              ? "draft"
              : s.status
            : "disabled") as SurfaceStatus,
          updatedAt: new Date().toISOString(),
        }
      : s
  );
  return { ...ensured, surfaces };
}

export function publicSurfaceTypeFromPath(
  segment: string
): SurfaceType | null {
  if (segment === "telegram" || segment === "b") return "telegram_mini_app";
  if (segment === "website" || segment === "s") return "website";
  if (segment === "mobile" || segment === "m") return "mobile_web";
  return null;
}
