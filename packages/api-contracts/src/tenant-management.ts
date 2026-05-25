import type {
  IntegrationModuleStatus,
  TenantRecord,
  TenantStatus,
  ThemePreset,
} from "@astro/tenant-config";
import { z } from "zod";
import type { IntegrationStatuses } from "./integration";

export interface TenantBrandSummary {
  displayName: string;
  tagline?: string;
  avatarUrl?: string;
}

export interface TenantListItem extends TenantRecord {
  brandSummary: TenantBrandSummary;
  themePreset: ThemePreset;
  activeProductCount: number;
  enabledModuleCount: number;
  lastSavedDraftAt?: string;
  lastPublishedAt?: string;
  hasPublished: boolean;
  integrationStatuses: IntegrationStatuses;
}

export interface TenantDetail extends TenantListItem {
  ownerEmail: string;
}

export interface CreateTenantRequest {
  slug: string;
  displayName: string;
  preset: ThemePreset;
  ownerEmail?: string;
}

export interface UpdateTenantStatusRequest {
  status: TenantStatus;
}

export const tenantListItemSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  displayName: z.string().min(1),
  status: z.enum(["draft", "active", "paused"]),
  ownerEmail: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  brandSummary: z.object({
    displayName: z.string(),
    tagline: z.string().optional(),
    avatarUrl: z.string().optional(),
  }),
  themePreset: z.enum([
    "mystic-dark",
    "soft-feminine",
    "cosmic-violet",
    "luxury-gold",
    "minimal-white",
    "pink-moon",
  ]),
  activeProductCount: z.number().int().min(0),
  enabledModuleCount: z.number().int().min(0),
  lastSavedDraftAt: z.string().optional(),
  lastPublishedAt: z.string().optional(),
  hasPublished: z.boolean(),
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
});

export const tenantListSchema = z.array(tenantListItemSchema);

export type { IntegrationModuleStatus };
