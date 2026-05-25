import { createAnalyticsEvent } from "@astro/analytics";
import type { DashboardSummary, TenantDetail, TenantListItem } from "@astro/api-contracts";
import {
  buildTenantConfigStatus,
  buildMockFreeReportV2,
  createDefaultTenantConfig,
  validateTenantConfig,
  type BirthProfile,
  type ProductConfig,
  type AnyReport,
  type Report as AstroReport,
  type TenantConfig,
  type TenantConfigBundle,
  type TenantConfigStatus,
  type TenantRecord,
  type ThemePreset,
} from "@astro/tenant-config";
import { buildDashboardSummary, buildTenantDetail, buildTenantListItem } from "./summaries";
import {
  mockAnalyticsEvents,
  mockDashboardStats,
  mockReports,
  mockReportsRu,
  mockTenantConfigs,
  mockTenants,
  mockUsers,
} from "./fixtures";
import { delay } from "./utils";

function findTenantBySlug(slug: string): TenantRecord | undefined {
  return mockTenants.find((t) => t.slug === slug);
}

function findTenantById(id: string): TenantRecord | undefined {
  return mockTenants.find((t) => t.id === id);
}

function getBundle(tenantId: string): TenantConfigBundle {
  const bundle = mockTenantConfigs[tenantId];
  if (!bundle) throw new Error(`Tenant config not found: ${tenantId}`);
  return bundle;
}

export async function mockGetTenantConfigBySlug(
  slug: string,
  preview: "draft" | "published" = "published"
): Promise<TenantConfig> {
  await delay();
  const tenant = findTenantBySlug(slug);
  if (!tenant) throw new Error(`Tenant not found: ${slug}`);
  const bundle = getBundle(tenant.id);
  if (preview === "draft") return structuredClone(bundle.draft);
  if (!bundle.published) throw new Error(`No published config for: ${slug}`);
  if (tenant.status === "paused") throw new Error(`Tenant is paused: ${slug}`);
  return structuredClone(bundle.published);
}

export async function mockListTenants(): Promise<TenantListItem[]> {
  await delay(200);
  return mockTenants.map((t) => {
    const bundle = getBundle(t.id);
    const stats = mockDashboardStats[t.id];
    return buildTenantListItem(
      {
        ...t,
        updatedAt: bundle.draft.meta?.updatedAt ?? t.updatedAt,
      },
      bundle,
      stats
    );
  });
}

export async function mockGetDraftConfig(tenantId: string): Promise<TenantConfig> {
  await delay();
  return structuredClone(getBundle(tenantId).draft);
}

export async function mockSaveDraftConfig(
  tenantId: string,
  config: TenantConfig
): Promise<TenantConfig> {
  await delay();
  const validated = validateTenantConfig({ ...config, tenantId });
  validated.meta = {
    ...validated.meta,
    createdAt: validated.meta?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockTenantConfigs[tenantId] = {
    ...getBundle(tenantId),
    draft: validated,
  };
  const tenant = findTenantById(tenantId);
  if (tenant) tenant.updatedAt = validated.meta!.updatedAt;
  return structuredClone(validated);
}

export async function mockPublishConfig(tenantId: string): Promise<TenantConfig> {
  await delay(600);
  const bundle = getBundle(tenantId);
  const nextVersion = (bundle.published?.version ?? bundle.draft.version) + 1;
  const published: TenantConfig = {
    ...structuredClone(bundle.draft),
    version: nextVersion,
    publishedAt: new Date().toISOString(),
    meta: {
      ...bundle.draft.meta,
      createdAt: bundle.draft.meta?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  mockTenantConfigs[tenantId] = {
    draft: { ...structuredClone(published), version: nextVersion },
    published,
  };
  const tenant = findTenantById(tenantId);
  if (tenant) {
    tenant.status = "active";
    tenant.updatedAt = published.meta!.updatedAt;
  }
  if (mockDashboardStats[tenantId]) {
    mockDashboardStats[tenantId]!.lastPublishedAt = published.publishedAt;
  }
  return structuredClone(published);
}

export async function mockCreateTenant(input: {
  slug: string;
  displayName: string;
  preset: ThemePreset;
  ownerEmail?: string;
}): Promise<TenantRecord> {
  await delay(500);
  if (findTenantBySlug(input.slug)) throw new Error(`Slug already exists: ${input.slug}`);
  const id = `tenant_${input.slug.replace(/-/g, "_")}`;
  const now = new Date().toISOString();
  const tenant: TenantRecord = {
    id,
    slug: input.slug,
    displayName: input.displayName,
    status: "draft",
    ownerEmail: input.ownerEmail ?? `${input.slug}@demo.astrology.app`,
    createdAt: now,
    updatedAt: now,
  };
  const draft = createDefaultTenantConfig(id, input.slug, input.displayName, input.preset);
  draft.status = "draft";
  draft.version = 0;
  mockTenants.push(tenant);
  mockTenantConfigs[id] = { draft, published: null };
  mockDashboardStats[id] = {
    totalSessions: 0,
    reportsGenerated: 0,
    productClicks: 0,
  };
  mockReports[id] = createDefaultReport(id, input.displayName);
  return structuredClone(tenant);
}

function createDefaultReport(tenantId: string, displayName: string): AstroReport {
  return {
    id: `report_${tenantId}_free`,
    type: "free",
    title: `Your Reading from ${displayName}`,
    summary: "A personalized snapshot based on your birth profile.",
    generatedAt: new Date().toISOString(),
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Leo", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Virgo", icon: "moon" },
    ],
    sections: [
      {
        id: "s1",
        title: "Overview",
        content: "Your chart reveals unique strengths waiting to be expressed.",
        order: 0,
      },
    ],
    cta: { label: "Explore Products", action: "navigate_products" },
  };
}

export async function mockSetTenantStatus(
  tenantId: string,
  status: "active" | "paused" | "draft"
): Promise<TenantRecord> {
  await delay(300);
  const tenant = findTenantById(tenantId);
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
  tenant.status = status;
  tenant.updatedAt = new Date().toISOString();
  const bundle = getBundle(tenantId);
  bundle.draft.status = status;
  if (bundle.published) bundle.published.status = status;
  return structuredClone(tenant);
}

export async function mockSubmitBirthProfile(
  tenantId: string,
  userId: string,
  profile: Omit<BirthProfile, "userId" | "tenantId" | "createdAt">
): Promise<BirthProfile> {
  await delay(400);
  const saved: BirthProfile = {
    userId,
    tenantId,
    ...profile,
    createdAt: new Date().toISOString(),
  };
  mockUsers[`${tenantId}:${userId}`] = saved;
  return structuredClone(saved);
}

export async function mockGetBirthProfile(
  tenantId: string,
  userId: string
): Promise<BirthProfile | null> {
  await delay(200);
  return mockUsers[`${tenantId}:${userId}`] ?? null;
}

export async function mockGenerateFreeReport(
  tenantId: string,
  options?: {
    userId?: string;
    topic?: string;
    locale?: "en" | "ru";
    tenantSlug?: string;
    birthProfile?: BirthProfile;
  }
): Promise<AnyReport> {
  await delay(1800);
  const tenant = findTenantById(tenantId);
  const locale = options?.locale ?? "ru";
  const bundle = getBundle(tenantId);
  const config = bundle.published ?? bundle.draft;
  const products = config.products;

  const profile =
    options?.birthProfile ??
    (options?.userId != null ? mockUsers[`${tenantId}:${options.userId}`] : undefined);

  const theme =
    profile?.topic ??
    (options?.topic as BirthProfile["topic"]) ??
    "personality";

  if (profile) {
    return buildMockFreeReportV2({
      tenantId,
      birthProfile: profile,
      theme,
      locale,
      products,
    });
  }

  return buildMockFreeReportV2({
    tenantId,
    birthProfile: {
      name: tenant?.displayName ?? "Guest",
      birthDate: "1990-01-15",
      birthTime: null,
      timeAccuracy: "unknown",
      topic: theme,
    },
    theme,
    locale,
    products,
  });
}

export async function mockGetDashboardStats(tenantId: string) {
  await delay(200);
  return (
    mockDashboardStats[tenantId] ?? {
      totalSessions: 0,
      reportsGenerated: 0,
      productClicks: 0,
    }
  );
}

export async function mockTrackEvents(
  events: Array<{ tenantId: string; name: string; payload?: Record<string, unknown> }>
): Promise<void> {
  await delay(100);
  for (const event of events) {
    mockAnalyticsEvents.push(createAnalyticsEvent(event));
  }
}

export async function mockGetTenantBundle(tenantId: string): Promise<TenantConfigBundle> {
  await delay(200);
  return structuredClone(getBundle(tenantId));
}

export async function mockGetPublishedConfig(tenantId: string): Promise<TenantConfig | null> {
  await delay();
  const published = getBundle(tenantId).published;
  return published ? structuredClone(published) : null;
}

export async function mockGetConfigStatus(tenantId: string): Promise<TenantConfigStatus> {
  await delay(200);
  const bundle = getBundle(tenantId);
  return buildTenantConfigStatus(bundle.draft, bundle.published);
}

export async function mockRestoreDraftFromPublished(tenantId: string): Promise<TenantConfig> {
  await delay(400);
  const bundle = getBundle(tenantId);
  if (!bundle.published) {
    throw new Error(`No published config to restore from: ${tenantId}`);
  }
  const restored: TenantConfig = {
    ...structuredClone(bundle.published),
    meta: {
      ...bundle.published.meta,
      createdAt: bundle.published.meta?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  mockTenantConfigs[tenantId] = {
    ...bundle,
    draft: restored,
  };
  const tenant = findTenantById(tenantId);
  if (tenant) tenant.updatedAt = restored.meta!.updatedAt;
  return structuredClone(restored);
}

export async function mockDiscardDraftConfig(tenantId: string): Promise<TenantConfig> {
  return mockRestoreDraftFromPublished(tenantId);
}

export async function mockGetPublishedTenantConfigBySlug(
  slug: string
): Promise<TenantConfig | null> {
  await delay();
  const tenant = findTenantBySlug(slug);
  if (!tenant) throw new Error(`Tenant not found: ${slug}`);
  const published = getBundle(tenant.id).published;
  return published ? structuredClone(published) : null;
}

export async function mockGetTenantDetail(tenantId: string): Promise<TenantDetail> {
  await delay(200);
  const tenant = findTenantById(tenantId);
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
  const bundle = getBundle(tenantId);
  return buildTenantDetail(tenant, bundle, mockDashboardStats[tenantId]);
}

export async function mockGetReport(reportId: string): Promise<AnyReport> {
  await delay(200);
  for (const tenantId of Object.keys(mockReports)) {
    const report = mockReports[tenantId];
    if (report?.id === reportId) return structuredClone(report);
  }
  throw new Error(`Report not found: ${reportId}`);
}

export async function mockListReports(options?: {
  tenantId?: string;
  userId?: string;
}): Promise<Array<{ id: string; type: string; title: string; generatedAt: string }>> {
  await delay(200);
  const tenantIds = options?.tenantId ? [options.tenantId] : Object.keys(mockReports);
  return tenantIds
    .map((tenantId) => mockReports[tenantId])
    .filter((report): report is AstroReport => report != null)
    .map((report) => ({
      id: report.id,
      type: report.type,
      title: report.title,
      generatedAt: report.generatedAt,
    }));
}

export async function mockGetProducts(slug: string): Promise<ProductConfig[]> {
  await delay(200);
  const config = await mockGetTenantConfigBySlug(slug, "published");
  return config.products.filter((p) => p.status === "active");
}

export async function mockGetProductById(
  slug: string,
  productId: string
): Promise<ProductConfig | null> {
  await delay(200);
  const config = await mockGetTenantConfigBySlug(slug, "published");
  return config.products.find((p) => p.id === productId && p.status === "active") ?? null;
}

export async function mockGetDashboardSummary(tenantId: string): Promise<DashboardSummary> {
  await delay(200);
  const tenant = findTenantById(tenantId);
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
  const bundle = getBundle(tenantId);
  const stats =
    mockDashboardStats[tenantId] ?? {
      totalSessions: 0,
      reportsGenerated: 0,
      productClicks: 0,
    };
  return buildDashboardSummary(tenant, bundle, stats);
}

const mockMediaAssets: Record<string, import("@astro/api-contracts").MediaAsset[]> = {};

export async function mockGetDashboardMetrics(
  tenantId: string,
  period: "7d" | "30d" = "7d"
) {
  await delay(200);
  const stats = mockDashboardStats[tenantId] ?? {
    totalSessions: 0,
    reportsGenerated: 0,
    productClicks: 0,
  };
  const visits = stats.totalSessions;
  const profiles = Math.round(visits * 0.4);
  const reports = stats.reportsGenerated;
  return {
    period,
    visits,
    onboardingStarts: Math.round(visits * 0.6),
    birthProfilesSubmitted: profiles,
    freeReportsRequested: reports,
    freeReportsViewed: Math.round(reports * 0.9),
    productClicks: stats.productClicks,
    productCtaClicks: Math.round(stats.productClicks * 0.5),
    reportsGenerated: reports,
    reportFailures: Math.round(reports * 0.05),
    conversion: {
      visitToProfile: visits ? profiles / visits : 0,
      profileToReport: profiles ? reports / profiles : 0,
      reportToProductClick: reports ? stats.productClicks / reports : 0,
    },
  };
}

export async function mockUploadTenantMedia(
  tenantId: string,
  file: File,
  kind: import("@astro/api-contracts").MediaKind
) {
  await delay(300);
  const tenant = findTenantById(tenantId);
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
  const asset = {
    id: `media_${Date.now()}`,
    tenantId,
    kind,
    publicUrl: URL.createObjectURL(file),
    originalFilename: file.name,
    mimeType: file.type || "image/png",
    sizeBytes: file.size,
    width: null,
    height: null,
    status: "active" as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  mockMediaAssets[tenantId] = [...(mockMediaAssets[tenantId] ?? []), asset];
  return asset;
}

export async function mockListTenantMedia(tenantId: string) {
  await delay(200);
  return mockMediaAssets[tenantId] ?? [];
}

export async function mockDeleteTenantMedia(tenantId: string, assetId: string) {
  await delay(200);
  mockMediaAssets[tenantId] = (mockMediaAssets[tenantId] ?? []).filter((a) => a.id !== assetId);
  return { deleted: true, id: assetId };
}

export async function mockGetTenantHealth(tenantId: string) {
  await delay(200);
  const tenant = findTenantById(tenantId);
  if (!tenant) throw new Error(`Tenant not found: ${tenantId}`);
  const bundle = getBundle(tenantId);
  const stats = mockDashboardStats[tenantId];
  return {
    tenantId,
    slug: tenant.slug,
    status: tenant.status,
    hasPublishedConfig: Boolean(bundle.published),
    hasDraftConfig: Boolean(bundle.draft),
    activeProductCount: bundle.draft.products.filter((p) => p.status === "active").length,
    enabledModulesCount: Object.entries(bundle.draft.modules).filter(
      ([key, value]) => !["payments", "telegram", "analytics"].includes(key) && value === true
    ).length,
    recentAnalyticsCount: mockAnalyticsEvents.filter((e) => e.tenantId === tenantId).length,
    recentReportFailures: 0,
    lastReportGeneratedAt: stats?.lastPublishedAt ?? null,
    lastPublishedAt: bundle.published?.publishedAt ?? null,
    integrationStatuses: {
      telegram: "not_configured" as const,
      payments: "coming_later" as const,
      analytics: "mock_only" as const,
      backendApi: "mock_only" as const,
      reportGeneration: "mock_only" as const,
    },
    mediaAssetCounts: (mockMediaAssets[tenantId] ?? []).reduce<Record<string, number>>(
      (acc, asset) => {
        acc[asset.kind] = (acc[asset.kind] ?? 0) + 1;
        return acc;
      },
      {}
    ),
    warnings: tenant.status === "paused" ? ["Tenant is paused"] : [],
  };
}

export async function mockListAuditLogs(params?: {
  tenantId?: string;
  action?: string;
  limit?: number;
}) {
  await delay(200);
  const entries = [
    {
      id: "audit_demo_1",
      actorAccountId: "account_admin",
      tenantId: params?.tenantId ?? "tenant_mystic",
      action: "config_published",
      payload: { version: 1 },
      createdAt: new Date().toISOString(),
    },
  ];
  return entries.slice(0, params?.limit ?? 50);
}
