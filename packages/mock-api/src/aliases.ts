import type { DashboardStats, ProductConfig, TenantConfig, TenantRecord } from "@astro/tenant-config";
import { mockTenants } from "./fixtures";
import {
  mockGetDashboardStats,
  mockGetTenantConfigBySlug,
  mockListTenants,
} from "./handlers";

/** Package 1 spec aliases for mock API functions */

export async function getMockTenants(): Promise<TenantRecord[]> {
  return mockListTenants();
}

export async function getMockTenantBySlug(slug: string): Promise<TenantRecord | undefined> {
  const tenants = await mockListTenants();
  return tenants.find((t) => t.slug === slug);
}

export async function getMockTenantConfig(slug: string): Promise<TenantConfig> {
  return mockGetTenantConfigBySlug(slug);
}

export async function getMockProducts(slug: string): Promise<ProductConfig[]> {
  const config = await mockGetTenantConfigBySlug(slug);
  return config.products.filter((p) => p.status === "active");
}

export async function getMockDashboardSummary(slug: string): Promise<DashboardStats> {
  const tenant = mockTenants.find((t) => t.slug === slug);
  if (!tenant) throw new Error(`Tenant not found: ${slug}`);
  return mockGetDashboardStats(tenant.id);
}
