import type { FunnelTopic, ProductLevel, RealProductType, TenantConfig, VisualPack } from "./types";

export interface PublicMiniAppProduct {
  productId: string;
  productType: RealProductType;
  title: string;
  priceLabel?: string;
  level: ProductLevel;
}

export interface PublicMiniAppLinks {
  general: string;
  money: string;
  relationships: string;
  personality: string;
}

export interface BuildPublicMiniAppInput {
  partnerId: string;
  partnerSlug: string;
  partnerName: string;
  tenantId: string;
  tenantSlug: string;
  partnerStatus: string;
  publishedConfig: TenantConfig;
  defaultTopic?: FunnelTopic | null;
  defaultVisualPack?: VisualPack;
  campaignId?: string;
  linkBasePath?: string;
  activeProductTypes?: string[];
}

export function buildPublicMiniAppLinks(slug: string, basePath = "/b"): PublicMiniAppLinks {
  const prefix = `${basePath}/${slug}`;
  return {
    general: prefix,
    money: `${prefix}/money`,
    relationships: `${prefix}/relationships`,
    personality: `${prefix}/personality`,
  };
}

export function buildPublicMiniAppResponse(input: BuildPublicMiniAppInput) {
  const config = input.publishedConfig;
  const miniApp = config.miniApp;
  const publicSlug = miniApp?.publicSlug ?? input.partnerSlug;
  const visualPack =
    miniApp?.visualPack ?? input.defaultVisualPack ?? ("brand_default" as VisualPack);
  const publicStatus = miniApp?.publicStatus ?? (config.status === "active" ? "published" : "draft");

  const activeProducts: PublicMiniAppProduct[] = config.products
    .filter((p) => p.status === "active")
    .filter((p) =>
      input.activeProductTypes ? input.activeProductTypes.includes(p.productType) : true
    )
    .map((p) => ({
      productId: p.id,
      productType: p.productType,
      title: p.title,
      priceLabel: p.priceLabel,
      level: p.level,
    }));

  return {
    partnerId: input.partnerId,
    partnerSlug: input.partnerSlug,
    partnerName: input.partnerName,
    tenantId: input.tenantId,
    tenantSlug: input.tenantSlug,
    creatorId: input.partnerId,
    slug: publicSlug,
    status: publicStatus === "published" && input.partnerStatus === "active" ? "published" : publicStatus,
    miniAppName: config.brand.name ?? config.brand.displayName,
    creatorDisplayName: config.brand.displayName,
    shortBio: config.brand.bio ?? null,
    avatarUrl: config.brand.avatarUrl ?? null,
    heroTitle: config.content.home.headline,
    heroSubtitle: config.content.home.subheadline ?? "",
    visualPack,
    defaultTopic: miniApp?.defaultTopic ?? input.defaultTopic ?? null,
    activeProducts,
    publicLinks: buildPublicMiniAppLinks(publicSlug),
    allowedTopics: ["money", "relationships", "personality"] as FunnelTopic[],
    campaignId: input.campaignId,
  };
}

export function isPublicMiniAppAvailable(response: {
  status: string;
  partnerStatus?: string;
}): boolean {
  return response.status === "published";
}
