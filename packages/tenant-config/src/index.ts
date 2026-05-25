export * from "./types";
export * from "./schema";
export * from "./defaults";
export * from "./validation";
export * from "./config-diff";
export * from "./package1";
export * from "./localize";
export * from "./product-catalog";
export * from "./report-v2-mock";
export * from "./visual-pack";
export * from "./report-library";
export * from "./public-miniapp";

import { tenantConfigSchema } from "./schema";
import type { TenantConfig } from "./types";

export function validateTenantConfig(config: unknown): TenantConfig {
  return tenantConfigSchema.parse(config);
}

export function cloneTenantConfig(config: TenantConfig): TenantConfig {
  return structuredClone(config);
}
