import type {
  DashboardSummary,
  TenantDetail,
  TenantListItem,
} from "@astro/api-contracts";
import {
  countActiveProducts,
  countEnabledModules,
  defaultIntegrationStatuses,
} from "@astro/api-contracts";
import {
  buildTenantConfigStatus,
  getSetupProgress,
  type TenantConfig,
  type TenantConfigBundle,
  type TenantRecord,
} from "@astro/tenant-config";
import type { DashboardStats } from "@astro/tenant-config";

export function buildTenantListItem(
  tenant: TenantRecord,
  bundle: TenantConfigBundle,
  stats?: DashboardStats
): TenantListItem {
  const draft = bundle.draft;
  return {
    ...tenant,
    brandSummary: {
      displayName: draft.brand.displayName,
      tagline: draft.brand.tagline,
      avatarUrl: draft.brand.avatarUrl,
    },
    themePreset: draft.theme.preset,
    activeProductCount: countActiveProducts(draft.products),
    enabledModuleCount: countEnabledModules(draft.modules),
    lastSavedDraftAt: draft.meta?.updatedAt,
    lastPublishedAt: bundle.published?.publishedAt ?? stats?.lastPublishedAt,
    hasPublished: bundle.published != null,
    integrationStatuses: defaultIntegrationStatuses("mock"),
  };
}

export function buildTenantDetail(
  tenant: TenantRecord,
  bundle: TenantConfigBundle,
  stats?: DashboardStats
): TenantDetail {
  return {
    ...buildTenantListItem(tenant, bundle, stats),
    ownerEmail: tenant.ownerEmail,
  };
}

export function buildDashboardSummary(
  tenant: TenantRecord,
  bundle: TenantConfigBundle,
  stats: DashboardStats
): DashboardSummary {
  const draft = bundle.draft;
  const configStatus = buildTenantConfigStatus(bundle.draft, bundle.published);
  return {
    tenantId: tenant.id,
    slug: tenant.slug,
    status: draft.status,
    setupChecklist: getSetupProgress(draft),
    activeProductsCount: countActiveProducts(draft.products),
    enabledModulesCount: countEnabledModules(draft.modules),
    hasUnpublishedChanges: configStatus.hasUnpublishedChanges,
    lastSavedDraft: draft.meta?.updatedAt,
    lastPublished: bundle.published?.publishedAt ?? stats.lastPublishedAt,
    configStatus,
    integrationStatuses: defaultIntegrationStatuses("mock"),
    analytics: stats,
  };
}
