import type {
  DashboardStats,
  SetupProgress,
  TenantConfigStatus,
  TenantStatus,
} from "@astro/tenant-config";
import { z } from "zod";
import type { IntegrationStatuses } from "./integration";

export interface DashboardSummary {
  tenantId: string;
  slug: string;
  status: TenantStatus;
  setupChecklist: SetupProgress;
  activeProductsCount: number;
  enabledModulesCount: number;
  hasUnpublishedChanges: boolean;
  lastSavedDraft?: string;
  lastPublished?: string;
  configStatus: TenantConfigStatus;
  integrationStatuses: IntegrationStatuses;
  analytics?: DashboardStats;
}

export const dashboardSummarySchema = z.object({
  tenantId: z.string().min(1),
  slug: z.string().min(1),
  status: z.enum(["draft", "active", "paused"]),
  setupChecklist: z.object({
    brandAdded: z.boolean(),
    designSelected: z.boolean(),
    mainTextConfigured: z.boolean(),
    hasActiveProduct: z.boolean(),
    hasFreeReportActive: z.boolean(),
    hasPaidProductActive: z.boolean(),
    miniAppSlugConfigured: z.boolean(),
    visualPackSelected: z.boolean(),
    previewChecked: z.boolean(),
  }),
  activeProductsCount: z.number().int().min(0),
  enabledModulesCount: z.number().int().min(0),
  hasUnpublishedChanges: z.boolean(),
  lastSavedDraft: z.string().optional(),
  lastPublished: z.string().optional(),
  configStatus: z.object({
    hasUnpublishedChanges: z.boolean(),
    draftUpdatedAt: z.string(),
    lastPublishedAt: z.string().optional(),
    publishedVersion: z.number().int().optional(),
    draftVersion: z.number().int(),
    changedAreas: z.array(z.enum(["brand", "design", "content", "products", "modules"])),
  }),
  integrationStatuses: z.object({
    telegram: z.enum(["not_configured", "coming_later", "mock_only", "active", "error"]),
    payments: z.enum(["not_configured", "coming_later", "mock_only", "active", "error"]),
    analytics: z.enum(["not_configured", "coming_later", "mock_only", "active", "error"]),
    backendApi: z.enum(["not_configured", "coming_later", "mock_only", "active", "error"]),
    reportGeneration: z.enum([
      "not_configured",
      "coming_later",
      "mock_only",
      "active",
      "error",
    ]),
  }),
  analytics: z
    .object({
      totalSessions: z.number().int(),
      reportsGenerated: z.number().int(),
      productClicks: z.number().int(),
      lastPublishedAt: z.string().optional(),
    })
    .optional(),
});

export type { DashboardStats };
