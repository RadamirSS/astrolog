import { z } from "zod";
import { integrationStatusesSchema } from "./integration";

export const mediaKindSchema = z.enum(["avatar", "logo", "cover", "product", "other"]);

export const mediaAssetSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  kind: mediaKindSchema,
  publicUrl: z.string().min(1),
  originalFilename: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number().int().min(0),
  width: z.number().int().nullable().optional(),
  height: z.number().int().nullable().optional(),
  status: z.enum(["active", "deleted"]),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const mediaAssetListSchema = z.array(mediaAssetSchema);

export const mediaDeleteResponseSchema = z.object({
  deleted: z.boolean(),
  id: z.string(),
});

export type MediaKind = z.infer<typeof mediaKindSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;

export const tenantHealthSchema = z.object({
  tenantId: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(["draft", "active", "paused"]),
  hasPublishedConfig: z.boolean(),
  hasDraftConfig: z.boolean(),
  activeProductCount: z.number().int().min(0),
  enabledModulesCount: z.number().int().min(0),
  recentAnalyticsCount: z.number().int().min(0),
  recentReportFailures: z.number().int().min(0),
  lastReportGeneratedAt: z.string().nullable().optional(),
  lastPublishedAt: z.string().nullable().optional(),
  integrationStatuses: integrationStatusesSchema,
  mediaAssetCounts: z.record(z.number().int().min(0)),
  warnings: z.array(z.string()),
});

export const auditLogItemSchema = z.object({
  id: z.string().min(1),
  actorAccountId: z.string().nullable().optional(),
  tenantId: z.string().nullable().optional(),
  action: z.string(),
  payload: z.record(z.unknown()).nullable().optional(),
  createdAt: z.string(),
});

export const auditLogListSchema = z.array(auditLogItemSchema);

export type TenantHealth = z.infer<typeof tenantHealthSchema>;
export type AuditLogItem = z.infer<typeof auditLogItemSchema>;

export const trackAnalyticsEventsResponseSchema = z.object({
  accepted: z.boolean(),
});
