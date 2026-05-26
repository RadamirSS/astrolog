import { z } from "zod";
import {
  funnelTopicSchema,
  realProductTypeSchema,
  visualPackSchema,
} from "./ops";

export const surfaceTypeSchema = z.enum(["telegram_mini_app", "website", "mobile_web"]);
export const surfaceStatusSchema = z.enum([
  "disabled",
  "draft",
  "configured",
  "published",
  "error",
]);

export const surfaceConfigResponseSchema = z.object({
  id: z.string(),
  type: surfaceTypeSchema,
  status: surfaceStatusSchema,
  publicUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  configJson: z.record(z.unknown()),
  publishedAt: z.string().optional(),
});

export const creatorMiniAppResponseSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  creatorId: z.string().optional(),
  slug: z.string(),
  name: z.string(),
  status: z.enum(["draft", "published", "paused", "archived"]),
  defaultVisualPack: visualPackSchema,
  defaultTopic: funnelTopicSchema.nullable().optional(),
  activeProducts: z.array(z.string()),
  branding: z.object({
    displayName: z.string(),
    avatarUrl: z.string().nullable().optional(),
    bio: z.string().nullable().optional(),
    heroTitle: z.string(),
    heroSubtitle: z.string().optional(),
    ctaText: z.string().optional(),
  }),
  surfaces: z.array(surfaceConfigResponseSchema),
  publishedAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const publicSurfaceProductSchema = z.object({
  productId: z.string(),
  productType: realProductTypeSchema,
  title: z.string(),
  priceLabel: z.string().optional(),
  level: z.enum(["free", "low_ticket", "bundle", "main", "premium"]),
});

export const publicSurfaceResponseSchema = z.object({
  surfaceType: surfaceTypeSchema,
  slug: z.string(),
  status: z.string(),
  tenantId: z.string(),
  tenantSlug: z.string(),
  miniAppName: z.string(),
  creatorDisplayName: z.string(),
  shortBio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  heroTitle: z.string(),
  heroSubtitle: z.string().optional(),
  visualPack: visualPackSchema,
  defaultTopic: funnelTopicSchema.nullable().optional(),
  activeProducts: z.array(publicSurfaceProductSchema),
  publicLinks: z.record(z.string()),
  content: z.record(z.unknown()).optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  bottomNavEnabled: z.boolean().optional(),
  installableHintEnabled: z.boolean().optional(),
});

export type SurfaceConfigResponse = z.infer<typeof surfaceConfigResponseSchema>;
export type CreatorMiniAppResponse = z.infer<typeof creatorMiniAppResponseSchema>;
export type PublicSurfaceResponse = z.infer<typeof publicSurfaceResponseSchema>;
