import type {
  CreatorMiniAppResponse,
  PublicSurfaceResponse,
  TelegramIntegrationStatusResponse,
  ValidateTelegramBotResponse,
} from "@astro/api-contracts";
import {
  ensureSurfaces,
  getSurfaceByType,
  setSurfaceEnabled,
  syncSurfaceUrls,
  updateSurfaceInMiniApp,
  validateMiniAppPublish,
  type CreatorMiniAppConfig,
  type SurfaceConfig,
  type SurfaceType,
  type TenantConfig,
  type TelegramSurfaceConfig,
} from "@astro/tenant-config";
import { delay } from "../utils";
import {
  mockGetDraftConfig,
  mockPublishConfig,
  mockSaveDraftConfig,
} from "../handlers";
import { resolvePublicPartnerConfig } from "../fixtures/ops/public-partner";

const TOKEN_PATTERN = /^\d+:[A-Za-z0-9_-]{30,}$/;

const mockTelegramIntegrations: Record<
  string,
  {
    integrationId: string;
    tenantId: string;
    botId: string;
    botUsername: string;
    botDisplayName: string;
    token: string;
    status: TelegramIntegrationStatusResponse["status"];
    webhookStatus: TelegramIntegrationStatusResponse["webhookStatus"];
    menuStatus: TelegramIntegrationStatusResponse["menuStatus"];
    lastValidatedAt: string;
  }
> = {};

function buildCreatorMiniAppResponse(config: TenantConfig): CreatorMiniAppResponse {
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const status =
    miniApp.publicStatus === "published"
      ? "published"
      : miniApp.publicStatus === "paused"
        ? "paused"
        : "draft";

  return {
    id: `miniapp_${config.tenantId}`,
    tenantId: config.tenantId,
    creatorId: config.tenantId,
    slug: miniApp.publicSlug,
    name: miniApp.name ?? config.brand.displayName,
    status,
    defaultVisualPack: miniApp.visualPack,
    defaultTopic: miniApp.defaultTopic,
    activeProducts: config.products.filter((p) => p.status === "active").map((p) => p.id),
    branding: {
      displayName: config.brand.displayName,
      avatarUrl: config.brand.avatarUrl ?? null,
      bio: config.brand.bio ?? null,
      heroTitle: config.content.home.headline,
      heroSubtitle: config.content.home.subheadline,
      ctaText: config.content.home.ctaLabel,
    },
    surfaces: (miniApp.surfaces ?? []).map((s) => ({
      id: s.id,
      type: s.type,
      status: s.status,
      publicUrl: s.publicUrl,
      previewUrl: s.previewUrl,
      configJson: sanitizeSurfaceConfigJson(s),
      publishedAt: s.publishedAt,
    })),
    publishedAt: config.publishedAt,
    updatedAt: config.meta?.updatedAt,
  };
}

function sanitizeSurfaceConfigJson(surface: SurfaceConfig): Record<string, unknown> {
  const json = { ...surface.configJson } as Record<string, unknown>;
  delete json.token;
  delete json.encryptedToken;
  delete json.encryptedTokenRef;
  return json;
}

export async function mockGetCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  return buildCreatorMiniAppResponse(config);
}

export async function mockUpdateCreatorMiniApp(
  tenantId: string,
  patch: Partial<CreatorMiniAppResponse>
): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  const next = await mockSaveDraftConfig(tenantId, {
    ...config,
    brand: {
      ...config.brand,
      displayName: patch.branding?.displayName ?? config.brand.displayName,
      avatarUrl: patch.branding?.avatarUrl ?? config.brand.avatarUrl,
      bio: patch.branding?.bio ?? config.brand.bio,
    },
    content: {
      ...config.content,
      home: {
        ...config.content.home,
        headline: patch.branding?.heroTitle ?? config.content.home.headline,
        subheadline: patch.branding?.heroSubtitle ?? config.content.home.subheadline,
        ctaLabel: patch.branding?.ctaText ?? config.content.home.ctaLabel,
      },
    },
    miniApp: syncSurfaceUrls({
      ...ensureSurfaces(config.miniApp, config.slug),
      ...(patch.slug ? { publicSlug: patch.slug } : {}),
      ...(patch.defaultVisualPack ? { visualPack: patch.defaultVisualPack } : {}),
      ...(patch.defaultTopic !== undefined ? { defaultTopic: patch.defaultTopic } : {}),
      ...(patch.name ? { name: patch.name } : {}),
    }),
  });
  return buildCreatorMiniAppResponse(next);
}

export async function mockPublishCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  await delay(400);
  const draft = await mockGetDraftConfig(tenantId);
  const validation = validateMiniAppPublish(draft);
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message ?? "Publish validation failed");
  }
  const published = await mockPublishConfig(tenantId);
  return buildCreatorMiniAppResponse(published);
}

export async function mockUnpublishCreatorMiniApp(tenantId: string): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const next = await mockSaveDraftConfig(tenantId, {
    ...config,
    miniApp: {
      ...miniApp,
      publicStatus: "draft",
      surfaces: miniApp.surfaces?.map((s) =>
        s.status === "published" ? { ...s, status: "configured" as const } : s
      ),
    },
  });
  return buildCreatorMiniAppResponse(next);
}

export async function mockUpdateSurfaceConfig(
  tenantId: string,
  surfaceId: string,
  patch: Partial<SurfaceConfig>
): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const nextMiniApp = updateSurfaceInMiniApp(miniApp, surfaceId, patch);
  const next = await mockSaveDraftConfig(tenantId, { ...config, miniApp: nextMiniApp });
  return buildCreatorMiniAppResponse(next);
}

export async function mockSetSurfaceEnabled(
  tenantId: string,
  type: SurfaceType,
  enabled: boolean
): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  const miniApp = setSurfaceEnabled(ensureSurfaces(config.miniApp, config.slug), type, enabled);
  const next = await mockSaveDraftConfig(tenantId, { ...config, miniApp });
  return buildCreatorMiniAppResponse(next);
}

export async function mockPublishSurface(
  tenantId: string,
  surfaceId: string
): Promise<CreatorMiniAppResponse> {
  await delay();
  const config = await mockGetDraftConfig(tenantId);
  const validation = validateMiniAppPublish(config);
  if (!validation.valid) {
    throw new Error(validation.errors[0]?.message ?? "Publish validation failed");
  }
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const nextMiniApp = updateSurfaceInMiniApp(miniApp, surfaceId, {
    status: "published",
    publishedAt: new Date().toISOString(),
  });
  const next = await mockSaveDraftConfig(tenantId, {
    ...config,
    miniApp: { ...nextMiniApp, publicStatus: "published" },
  });
  await mockPublishConfig(tenantId);
  return buildCreatorMiniAppResponse(next);
}

export async function mockGetSurfacePreview(
  tenantId: string,
  surfaceId: string
): Promise<{ previewUrl: string; config: CreatorMiniAppResponse }> {
  await delay();
  const response = await mockGetCreatorMiniApp(tenantId);
  const surface = response.surfaces.find((s) => s.id === surfaceId);
  if (!surface?.previewUrl) throw new Error("Surface preview not found");
  return { previewUrl: surface.previewUrl, config: response };
}

function mockValidateToken(token: string): ValidateTelegramBotResponse {
  if (!TOKEN_PATTERN.test(token)) {
    return { valid: false, errorMessage: "Invalid bot token format" };
  }
  const botId = token.split(":")[0]!;
  return {
    valid: true,
    botUsername: `astro_bot_${botId.slice(-4)}`,
    botDisplayName: `Astro Bot ${botId.slice(-4)}`,
  };
}

export async function mockValidateTelegramBot(
  _tenantId: string,
  token: string
): Promise<ValidateTelegramBotResponse> {
  await delay(200);
  return mockValidateToken(token);
}

export async function mockConnectTelegramBot(
  tenantId: string,
  token: string
): Promise<TelegramIntegrationStatusResponse> {
  await delay(300);
  const validated = mockValidateToken(token);
  if (!validated.valid) {
    return {
      integrationId: "",
      tenantId,
      status: "invalid_token",
      errorMessage: validated.errorMessage,
    };
  }

  const config = await mockGetDraftConfig(tenantId);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const integrationId = `tg_${tenantId}`;
  const botUsername = validated.botUsername!;
  mockTelegramIntegrations[tenantId] = {
    integrationId,
    tenantId,
    botId: token.split(":")[0]!,
    botUsername,
    botDisplayName: validated.botDisplayName!,
    token,
    status: "webhook_configured",
    webhookStatus: "configured",
    menuStatus: "configured",
    lastValidatedAt: new Date().toISOString(),
  };

  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const tgConfig: TelegramSurfaceConfig = {
    ...(tgSurface?.configJson as TelegramSurfaceConfig),
    botIntegrationId: integrationId,
    botUsername,
    botDisplayName: validated.botDisplayName,
    botStatus: "webhook_configured",
    webhookStatus: "configured",
    miniAppUrl: `/b/${miniApp.publicSlug}`,
    deepLink: `https://t.me/${botUsername}?startapp=${miniApp.publicSlug}`,
    lastValidatedAt: new Date().toISOString(),
  };

  const surfaceId = tgSurface?.id ?? "surface_telegram_mini_app";
  await mockUpdateSurfaceConfig(tenantId, surfaceId, { configJson: tgConfig, status: "configured" });

  return {
    integrationId,
    tenantId,
    botId: token.split(":")[0],
    botUsername,
    botDisplayName: validated.botDisplayName,
    status: "webhook_configured",
    webhookStatus: "configured",
    menuStatus: "configured",
    lastValidatedAt: new Date().toISOString(),
    miniAppUrl: `/b/${miniApp.publicSlug}`,
    deepLink: `https://t.me/${botUsername}?startapp=${miniApp.publicSlug}`,
  };
}

export async function mockDisconnectTelegramBot(
  tenantId: string,
  integrationId?: string
): Promise<TelegramIntegrationStatusResponse> {
  await delay();
  delete mockTelegramIntegrations[tenantId];
  const config = await mockGetDraftConfig(tenantId);
  const miniApp = ensureSurfaces(config.miniApp, config.slug);
  const tgSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  if (tgSurface) {
    await mockUpdateSurfaceConfig(tenantId, tgSurface.id, {
      configJson: {
        botIntegrationId: integrationId,
        botStatus: "not_connected",
        botUsername: undefined,
        botDisplayName: undefined,
        webhookStatus: "pending",
      },
      status: "draft",
    });
  }
  return {
    integrationId: integrationId ?? `tg_${tenantId}`,
    tenantId,
    status: "disconnected",
    webhookStatus: "not_configured",
    menuStatus: "not_configured",
  };
}

export async function mockGetTelegramIntegrationStatus(
  tenantId: string
): Promise<TelegramIntegrationStatusResponse | null> {
  await delay();
  const stored = mockTelegramIntegrations[tenantId];
  if (!stored) {
    const config = await mockGetDraftConfig(tenantId);
    const miniApp = ensureSurfaces(config.miniApp, config.slug);
    const tg = getSurfaceByType(miniApp, "telegram_mini_app")?.configJson as
      | TelegramSurfaceConfig
      | undefined;
    if (!tg?.botIntegrationId) return null;
    return {
      integrationId: tg.botIntegrationId,
      tenantId,
      botUsername: tg.botUsername,
      botDisplayName: tg.botDisplayName,
      status: tg.botStatus === "webhook_configured" ? "webhook_configured" : "connected",
      webhookStatus: tg.webhookStatus ?? "not_configured",
      menuStatus: "configured",
      miniAppUrl: tg.miniAppUrl,
      deepLink: tg.deepLink,
      lastValidatedAt: tg.lastValidatedAt,
    };
  }
  return {
    integrationId: stored.integrationId,
    tenantId,
    botId: stored.botId,
    botUsername: stored.botUsername,
    botDisplayName: stored.botDisplayName,
    status: stored.status,
    webhookStatus: stored.webhookStatus,
    menuStatus: stored.menuStatus,
    lastValidatedAt: stored.lastValidatedAt,
    miniAppUrl: `/b/${(await mockGetDraftConfig(tenantId)).miniApp?.publicSlug}`,
    deepLink: `https://t.me/${stored.botUsername}?startapp=${(await mockGetDraftConfig(tenantId)).miniApp?.publicSlug}`,
  };
}

export async function mockResolvePublicSurface(
  type: "telegram" | "website" | "mobile",
  slug: string
): Promise<PublicSurfaceResponse> {
  await delay();
  const partner = resolvePublicPartnerConfig(slug);
  if (!partner) throw new Error("Surface not found");

  const surfaceTypeMap = {
    telegram: "telegram_mini_app",
    website: "website",
    mobile: "mobile_web",
  } as const;

  const surfaceType = surfaceTypeMap[type];
  const links: Record<string, string> = {
    ...partner.publicLinks,
    website: `/s/${slug}`,
    mobile: `/m/${slug}`,
    telegram: `/b/${slug}`,
  };

  return {
    surfaceType,
    slug,
    status: partner.status,
    tenantId: partner.tenantId,
    tenantSlug: partner.tenantSlug,
    miniAppName: partner.miniAppName,
    creatorDisplayName: partner.creatorDisplayName,
    shortBio: partner.shortBio ?? null,
    avatarUrl: partner.avatarUrl ?? null,
    heroTitle: partner.heroTitle,
    heroSubtitle: partner.heroSubtitle,
    visualPack: partner.visualPack,
    defaultTopic: partner.defaultTopic ?? null,
    activeProducts: partner.activeProducts,
    publicLinks: links,
    seoTitle: partner.miniAppName,
    seoDescription: partner.heroSubtitle,
    bottomNavEnabled: type === "mobile",
    installableHintEnabled: type === "mobile",
  };
}

export function mockResetTelegramIntegrations(): void {
  for (const key of Object.keys(mockTelegramIntegrations)) {
    delete mockTelegramIntegrations[key];
  }
}

export async function mockSetupDemoCreatorSurfaces(): Promise<void> {
  // Called from fixtures init — surfaces configured in fixture data
}
