import type { ConfigChangedArea, TenantConfig } from "./types";

function jsonEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function compareModules(
  draft: TenantConfig["modules"],
  published: TenantConfig["modules"]
): boolean {
  const draftCore = {
    onboarding: draft.onboarding,
    freeReport: draft.freeReport,
    products: draft.products,
    profile: draft.profile,
  };
  const publishedCore = {
    onboarding: published.onboarding,
    freeReport: published.freeReport,
    products: published.products,
    profile: published.profile,
  };
  return jsonEqual(draftCore, publishedCore);
}

export function getConfigChangedAreas(
  draft: TenantConfig,
  published: TenantConfig | null
): ConfigChangedArea[] {
  if (!published) return ["brand", "design", "content", "products", "modules"];

  const areas: ConfigChangedArea[] = [];

  if (!jsonEqual(draft.brand, published.brand)) areas.push("brand");
  if (!jsonEqual(draft.theme, published.theme)) areas.push("design");
  if (!jsonEqual(draft.content, published.content)) areas.push("content");
  if (!jsonEqual(draft.products, published.products)) areas.push("products");
  if (!compareModules(draft.modules, published.modules)) areas.push("modules");

  return areas;
}

export function computeHasUnpublishedChanges(
  draft: TenantConfig,
  published: TenantConfig | null
): boolean {
  if (!published) return true;
  return getConfigChangedAreas(draft, published).length > 0;
}

export function buildTenantConfigStatus(
  draft: TenantConfig,
  published: TenantConfig | null
): import("./types").TenantConfigStatus {
  const changedAreas = getConfigChangedAreas(draft, published);
  return {
    hasUnpublishedChanges: changedAreas.length > 0,
    draftUpdatedAt: draft.meta?.updatedAt ?? new Date().toISOString(),
    lastPublishedAt: published?.publishedAt,
    publishedVersion: published?.version,
    draftVersion: draft.version,
    changedAreas,
  };
}
