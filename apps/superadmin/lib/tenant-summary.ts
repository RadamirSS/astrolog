import type { TenantConfig } from "@astro/tenant-config";

export function countActiveProducts(config: TenantConfig): number {
  return config.products.filter((p) => p.status === "active").length;
}

export function countEnabledModules(config: TenantConfig): number {
  const m = config.modules;
  return [m.onboarding, m.freeReport, m.products, m.profile].filter(Boolean).length;
}

export function statusBadgeVariant(
  status: string
): "success" | "warning" | "neutral" {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "neutral";
}
