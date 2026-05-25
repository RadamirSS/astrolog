import type { TenantConfig, TenantConfigStatus } from "@astro/tenant-config";

export type { TenantConfigStatus };

/** POST publish / discard / restore response `data`: raw `TenantConfig`. */
export type PublishConfigPayload = TenantConfig;
export type DiscardDraftPayload = TenantConfig;
export type RestoreDraftPayload = TenantConfig;

/** GET config/status response `data`: raw `TenantConfigStatus` (not `{ status }`). */
export type ConfigStatusPayload = TenantConfigStatus;
