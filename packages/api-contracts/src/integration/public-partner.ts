import { z } from "zod";
import { funnelTopicSchema, realProductTypeSchema, visualPackSchema } from "../ops";

export const publicPartnerProductSchema = z.object({
  productId: z.string(),
  productType: realProductTypeSchema,
  title: z.string(),
  priceLabel: z.string().optional(),
  level: z.enum(["free", "low_ticket", "bundle", "main", "premium"]),
});

export const publicPartnerLinksSchema = z.object({
  general: z.string(),
  money: z.string(),
  relationships: z.string(),
  personality: z.string(),
});

export const publicPartnerSchema = z.object({
  partnerId: z.string(),
  partnerSlug: z.string(),
  partnerName: z.string(),
  tenantId: z.string(),
  tenantSlug: z.string(),
  creatorId: z.string().optional(),
  slug: z.string(),
  status: z.string(),
  miniAppName: z.string(),
  creatorDisplayName: z.string(),
  shortBio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  heroTitle: z.string(),
  heroSubtitle: z.string().optional(),
  visualPack: visualPackSchema,
  defaultTopic: funnelTopicSchema.nullable().optional(),
  activeProducts: z.array(publicPartnerProductSchema),
  publicLinks: publicPartnerLinksSchema,
  allowedTopics: z.array(funnelTopicSchema).optional(),
  campaignId: z.string().optional(),
});

export type PublicPartner = z.infer<typeof publicPartnerSchema>;
export type PublicPartnerProduct = z.infer<typeof publicPartnerProductSchema>;
