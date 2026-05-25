import type { TenantConfig } from "@astro/tenant-config";

export type { TenantConfig };

/** Wire payload: raw `TenantConfig` inside the API envelope (not `{ config }`). */
export type TenantConfigPayload = TenantConfig;

/** PUT /api/dashboard/tenants/:tenantId/config/draft request body. */
export type SaveDraftConfigRequest = TenantConfig;
