import type { FunnelTopic, TenantConfig, VisualPack } from "@astro/tenant-config";
import { buildPublicMiniAppResponse } from "@astro/tenant-config";
import { mockTenantConfigs } from "../index";

function findPublishedByPublicSlug(slug: string): { tenantId: string; tenantSlug: string; published: TenantConfig } | null {
  for (const [tenantId, bundle] of Object.entries(mockTenantConfigs)) {
    const published = bundle?.published;
    if (!published) continue;
    const publicSlug = published.miniApp?.publicSlug;
    if (publicSlug === slug) {
      return {
        tenantId,
        tenantSlug: published.slug,
        published,
      };
    }
  }
  return null;
}

export function resolvePublicPartnerConfig(slug: string) {
  const match = findPublishedByPublicSlug(slug);
  if (!match) {
    return null;
  }

  const miniApp = match.published.miniApp;
  const partnerStatus = miniApp?.partnerStatus ?? "active";
  if (partnerStatus !== "active") {
    return null;
  }
  if (miniApp?.publicStatus !== "published") {
    return null;
  }

  const partnerId = miniApp?.partnerId ?? `partner_${match.tenantId}`;
  const partnerSlug = miniApp?.partnerSlug ?? slug;
  const partnerName =
    miniApp?.partnerName ?? match.published.brand.displayName ?? match.published.brand.name ?? slug;

  return buildPublicMiniAppResponse({
    partnerId,
    partnerSlug,
    partnerName,
    tenantId: match.tenantId,
    tenantSlug: match.tenantSlug,
    partnerStatus,
    publishedConfig: match.published,
    defaultTopic: (miniApp?.defaultTopic as FunnelTopic | undefined) ?? null,
    defaultVisualPack: miniApp?.visualPack as VisualPack | undefined,
    campaignId: miniApp?.campaignId,
  });
}

export { MOCK_PARTNERS } from "./partners";
