import { z } from "zod";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a hex color");

export const themePresetSchema = z.enum([
  "mystic-dark",
  "soft-feminine",
  "cosmic-violet",
  "luxury-gold",
  "minimal-white",
  "pink-moon",
]);

export const productLevelSchema = z.enum([
  "free",
  "low_ticket",
  "bundle",
  "main",
  "premium",
]);

export const realProductTypeSchema = z.enum([
  "free_report",
  "low_ticket_money",
  "low_ticket_relationships",
  "low_ticket_personality",
  "bundle_all_topics",
  "main_natal_portrait",
  "premium_consultation",
]);

export const visualPackSchema = z.enum([
  "sky_clarity",
  "dark_gold_mystic",
  "pink_love",
  "cosmic_pastel",
  "brand_default",
]);

export const funnelTopicSchema = z.enum(["money", "relationships", "personality"]);

export const miniAppPublicStatusSchema = z.enum(["draft", "published", "paused"]);

export const productFaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const productConfigSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  type: z.enum([
    "consultation",
    "report",
    "course",
    "natal",
    "compatibility",
    "forecast",
    "custom",
  ]),
  productType: realProductTypeSchema,
  level: productLevelSchema,
  theme: funnelTopicSchema.optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  price: z.number().optional(),
  priceLabel: z.string().optional(),
  visualPack: visualPackSchema,
  format: z.string().optional(),
  includes: z.array(z.string()).optional(),
  excludes: z.array(z.string()).optional(),
  ctaLabel: z.string().min(1),
  ctaAction: z
    .enum(["telegram", "whatsapp", "external", "request", "coming-soon"])
    .optional(),
  ctaUrl: z.string().url().optional().or(z.literal("")),
  featured: z.boolean(),
  sortOrder: z.number().int(),
  status: z.enum(["active", "hidden"]),
});

export const tenantConfigSchema = z.object({
  tenantId: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  status: z.enum(["draft", "active", "paused"]),
  version: z.number().int().min(0),
  publishedAt: z.string().datetime().optional(),
  brand: z.object({
    displayName: z.string().min(1),
    name: z.string().optional(),
    tagline: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal("")),
    avatarUrl: z.string().url().optional().or(z.literal("")),
    coverUrl: z.string().url().optional().or(z.literal("")),
    bio: z.string().optional(),
    telegramUsername: z.string().optional(),
    instagramUrl: z.string().url().optional().or(z.literal("")),
    supportEmail: z.string().email().optional().or(z.literal("")),
  }),
  theme: z.object({
    preset: themePresetSchema,
    overrides: z
      .object({
        primaryColor: hexColor.optional(),
        accentColor: hexColor.optional(),
        backgroundType: z.enum(["solid", "gradient", "image"]).optional(),
        backgroundImageUrl: z.string().url().optional().or(z.literal("")),
        cardStyle: z.enum(["flat", "elevated", "glass"]).optional(),
        buttonStyle: z.enum(["rounded", "pill", "sharp"]).optional(),
        heroImageUrl: z.string().url().optional().or(z.literal("")),
      })
      .optional(),
  }),
  content: z.object({
    home: z.object({
      headline: z.string().min(1),
      subheadline: z.string().optional(),
      ctaLabel: z.string().min(1),
      whatYouReceive: z
        .array(
          z.object({
            id: z.string().min(1),
            title: z.string().min(1),
            text: z.string().min(1),
          })
        )
        .optional(),
      faqItems: z
        .array(
          z.object({
            question: z.string().min(1),
            answer: z.string().min(1),
          })
        )
        .optional(),
      consultationCta: z
        .object({
          title: z.string().min(1),
          subtitle: z.string().optional(),
          enabled: z.boolean(),
        })
        .optional(),
    }),
    onboarding: z.object({
      welcomeText: z.string().optional(),
      birthDateLabel: z.string().optional(),
      birthTimeLabel: z.string().optional(),
      birthPlaceLabel: z.string().optional(),
      topicLabel: z.string().optional(),
      stepsIntro: z.string().optional(),
    }),
    reportIntro: z.string().optional(),
    productsIntro: z.string().optional(),
    paywall: z
      .object({
        title: z.string().min(1),
        subtitle: z.string().optional(),
      })
      .optional(),
    profileLabels: z.record(z.string()).optional(),
    loadingMessages: z.array(z.string().min(1)).optional(),
  }),
  modules: z.object({
    onboarding: z.boolean(),
    freeReport: z.boolean(),
    products: z.boolean(),
    profile: z.boolean(),
    payments: z.object({ enabled: z.literal(false) }).optional(),
    telegram: z.object({ botConnected: z.literal(false) }).optional(),
    analytics: z.object({ enabled: z.literal(false) }).optional(),
  }),
  products: z.array(productConfigSchema),
  miniApp: z
    .object({
      publicSlug: z
        .string()
        .min(2)
        .regex(/^[a-z0-9-]+$/, "Public slug must be lowercase alphanumeric with hyphens"),
      visualPack: visualPackSchema,
      defaultTopic: funnelTopicSchema.nullable(),
      publicStatus: miniAppPublicStatusSchema,
      partnerId: z.string().optional(),
      partnerSlug: z.string().optional(),
      partnerName: z.string().optional(),
      partnerStatus: z.enum(["active", "paused", "blocked"]).optional(),
      campaignId: z.string().optional(),
      introCopy: z.string().optional(),
      welcomeMessage: z.string().optional(),
      promoCtaCopy: z.string().optional(),
    })
    .optional(),
  locales: z
    .object({
      ru: z
        .object({
          brand: z
            .object({
              displayName: z.string().optional(),
              name: z.string().optional(),
              tagline: z.string().optional(),
              bio: z.string().optional(),
            })
            .optional(),
          content: z
            .object({
              home: z
                .object({
                  headline: z.string().optional(),
                  subheadline: z.string().optional(),
                  ctaLabel: z.string().optional(),
                  whatYouReceive: z
                    .array(
                      z.object({
                        id: z.string().min(1),
                        title: z.string().min(1),
                        text: z.string().min(1),
                      })
                    )
                    .optional(),
                  faqItems: z
                    .array(
                      z.object({
                        question: z.string().min(1),
                        answer: z.string().min(1),
                      })
                    )
                    .optional(),
                  consultationCta: z
                    .object({
                      title: z.string().min(1),
                      subtitle: z.string().optional(),
                      enabled: z.boolean(),
                    })
                    .optional(),
                })
                .optional(),
              onboarding: z
                .object({
                  welcomeText: z.string().optional(),
                  birthDateLabel: z.string().optional(),
                  birthTimeLabel: z.string().optional(),
                  birthPlaceLabel: z.string().optional(),
                  topicLabel: z.string().optional(),
                  stepsIntro: z.string().optional(),
                })
                .optional(),
              reportIntro: z.string().optional(),
              productsIntro: z.string().optional(),
              paywall: z
                .object({
                  title: z.string().min(1),
                  subtitle: z.string().optional(),
                })
                .optional(),
              profileLabels: z.record(z.string()).optional(),
              loadingMessages: z.array(z.string().min(1)).optional(),
            })
            .optional(),
          products: z
            .record(
              z.object({
                title: z.string().optional(),
                description: z.string().optional(),
                priceLabel: z.string().optional(),
                ctaLabel: z.string().optional(),
              })
            )
            .optional(),
        })
        .optional(),
    })
    .optional(),
  meta: z
    .object({
      createdAt: z.string(),
      updatedAt: z.string(),
      createdBy: z.string().optional(),
    })
    .optional(),
});

export const tenantConfigBundleSchema = z.object({
  draft: tenantConfigSchema,
  published: tenantConfigSchema.nullable(),
});

export const birthProfileTopicSchema = funnelTopicSchema;

export const birthTimeAccuracySchema = z.enum(["exact", "approximate", "unknown"]);

export const birthProfileSchema = z.object({
  name: z.string().min(1, "Name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  birthTime: z.string().nullable().optional(),
  timeAccuracy: birthTimeAccuracySchema.default("unknown"),
  birthPlace: z.string().min(1, "Birth city is required"),
  topic: funnelTopicSchema.optional(),
});

export const tenantConfigStatusSchema = z.object({
  hasUnpublishedChanges: z.boolean(),
  draftUpdatedAt: z.string(),
  lastPublishedAt: z.string().optional(),
  publishedVersion: z.number().int().optional(),
  draftVersion: z.number().int(),
  changedAreas: z.array(z.enum(["brand", "design", "content", "products", "modules"])),
});

const reportHighlightSchema = z.object({
  id: z.string().min(1),
  label: z.string().optional(),
  value: z.string().optional(),
  title: z.string().optional(),
  text: z.string().optional(),
  icon: z.string().optional(),
});

const reportSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string(),
  order: z.number().int(),
  variant: z.enum(["default", "quote", "highlight"]).optional(),
  access: z.enum(["free", "locked", "paid"]).optional(),
  icon: z.string().optional(),
});

const lockedSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  teaser: z.string(),
  unlockProductId: z.string().optional(),
});

export const reportSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(["free", "natal", "compatibility", "forecast", "custom"]),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    summary: z.string(),
    generatedAt: z.string().optional(),
    createdAt: z.string().optional(),
    highlights: z.array(reportHighlightSchema),
    sections: z.array(reportSectionSchema),
    lockedSections: z.array(lockedSectionSchema).optional(),
    cta: z
      .object({
        label: z.string(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        buttonLabel: z.string().optional(),
        target: z.string().optional(),
        productId: z.string().optional(),
        action: z.enum(["navigate_products", "external_url"]),
        url: z.string().optional(),
      })
      .optional(),
    recommendedProducts: z.array(z.string()).optional(),
  })
  .transform((data) => {
    const generatedAt = data.generatedAt ?? data.createdAt;
    if (!generatedAt) {
      throw new Error("Report requires generatedAt or createdAt");
    }
    const { createdAt: _createdAt, ...rest } = data;
    return {
      ...rest,
      generatedAt,
    };
  });

export const reportSectionV2Schema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "hero",
    "planet_card",
    "insight",
    "summary",
    "locked_preview",
    "cta",
    "disclaimer",
  ]),
  title: z.string().min(1),
  content: z.string(),
  order: z.number().int(),
  subtitle: z.string().optional(),
  icon: z.string().optional(),
  planet: z.enum(["sun", "moon", "ascendant"]).optional(),
  uncertain: z.boolean().optional(),
  productId: z.string().optional(),
});

export const reportActionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "buy_product",
    "open_product",
    "open_paywall",
    "download_pdf",
    "request_premium",
  ]),
  label: z.string().min(1),
  productId: z.string().optional(),
  productType: realProductTypeSchema.optional(),
  url: z.string().optional(),
});

export const reportV2Schema = z.object({
  schemaVersion: z.literal(2),
  id: z.string().min(1),
  productType: realProductTypeSchema,
  level: productLevelSchema,
  theme: funnelTopicSchema.optional(),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  visualPack: visualPackSchema,
  status: z.enum([
    "draft",
    "queued",
    "generating",
    "ready",
    "failed",
    "locked",
    "paid_pending",
  ]),
  birthProfileId: z.string().optional(),
  sections: z.array(reportSectionV2Schema),
  actions: z.array(reportActionSchema).optional(),
  pdfUrl: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const birthProfileResponseSchema = birthProfileSchema.extend({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  createdAt: z.string(),
});
