import type { SurfaceType, TenantConfig } from "./types";
import { REAL_PRODUCT_TYPES } from "./types";
import {
  ensureSurfaces,
  getEnabledSurfaces,
  getSurfaceByType,
  REFERENCE_VISUAL_PACKS,
} from "./surfaces";

const HEX_COLOR = /^#[0-9A-Fa-f]{6}$/;
const URL_PATTERN = /^https?:\/\/.+/;
const SLUG_PATTERN = /^[a-z0-9-]+$/;

export interface FieldError {
  path: string;
  message: string;
}

export interface SetupProgress {
  brandAdded: boolean;
  designSelected: boolean;
  mainTextConfigured: boolean;
  hasActiveProduct: boolean;
  hasFreeReportActive: boolean;
  hasPaidProductActive: boolean;
  miniAppSlugConfigured: boolean;
  visualPackSelected: boolean;
  previewChecked: boolean;
  surfacesSelected: boolean;
  telegramBotConnected: boolean;
}

export interface PublishValidationResult {
  valid: boolean;
  errors: FieldError[];
}

export interface DefaultSellingCopy {
  home: TenantConfig["content"]["home"];
  onboarding: TenantConfig["content"]["onboarding"];
  reportIntro: string;
  productsIntro: string;
  paywall: { title: string; subtitle: string };
  loadingMessages: string[];
  consultationCta: { title: string; subtitle: string; enabled: boolean };
}

export function getDefaultSellingCopy(displayName = "Your App"): DefaultSellingCopy {
  return {
    home: {
      headline: `Welcome to ${displayName}`,
      subheadline: "Your personalized astrology journey starts here.",
      ctaLabel: "Get My Free Reading",
      faqItems: [
        {
          question: "Is the free reading really free?",
          answer: "Yes — your first snapshot reading is complimentary with no payment required.",
        },
        {
          question: "How long does it take?",
          answer: "Most readings are ready in under a minute after you share your birth details.",
        },
      ],
    },
    onboarding: {
      welcomeText: "Tell us about your birth details to unlock your free reading.",
      stepsIntro: "We use your birth information to personalize your cosmic insights.",
      birthDateLabel: "Birth Date",
      birthTimeLabel: "Birth Time (optional)",
      birthPlaceLabel: "Birth Place",
    },
    reportIntro: "Here is your personalized snapshot based on your birth profile.",
    productsIntro: "Go deeper with premium offerings from your astrologer.",
    paywall: {
      title: "Unlock Full Access",
      subtitle: "Premium insights and deeper readings await you.",
    },
    loadingMessages: [
      "Reading the stars for you...",
      "Aligning your cosmic blueprint...",
      "Almost ready...",
    ],
    consultationCta: {
      title: "Book a Personal Consultation",
      subtitle: "Get one-on-one guidance tailored to your chart.",
      enabled: true,
    },
  };
}

export function getSetupProgress(config: TenantConfig): SetupProgress {
  const brandAdded =
    config.brand.displayName.trim().length > 0 &&
    (Boolean(config.brand.avatarUrl) || Boolean(config.brand.bio));

  const designSelected = Boolean(config.theme.preset);

  const mainTextConfigured =
    config.content.home.headline.trim().length > 0 &&
    config.content.home.ctaLabel.trim().length > 0;

  const hasActiveProduct = config.products.some((p) => p.status === "active");
  const hasFreeReportActive = config.products.some(
    (p) => p.productType === "free_report" && p.status === "active"
  );
  const hasPaidProductActive = config.products.some(
    (p) => p.status === "active" && p.level !== "free"
  );
  const miniAppSlugConfigured = Boolean(config.miniApp?.publicSlug?.trim());
  const visualPackSelected = Boolean(config.miniApp?.visualPack);
  const miniApp = config.miniApp
    ? ensureSurfaces(config.miniApp, config.miniApp.publicSlug)
    : undefined;
  const enabledSurfaces = getEnabledSurfaces(miniApp);
  const surfacesSelected = enabledSurfaces.length > 0;
  const telegramSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  const telegramEnabled = Boolean(telegramSurface && telegramSurface.status !== "disabled");
  const tgConfig = telegramSurface?.configJson as { botStatus?: string } | undefined;
  const telegramBotConnected =
    !telegramEnabled ||
    tgConfig?.botStatus === "connected" ||
    tgConfig?.botStatus === "webhook_configured";

  const previewChecked =
    brandAdded &&
    designSelected &&
    mainTextConfigured &&
    hasActiveProduct &&
    hasFreeReportActive &&
    hasPaidProductActive &&
    miniAppSlugConfigured &&
    visualPackSelected &&
    surfacesSelected;

  return {
    brandAdded,
    designSelected,
    mainTextConfigured,
    hasActiveProduct,
    hasFreeReportActive,
    hasPaidProductActive,
    miniAppSlugConfigured,
    visualPackSelected,
    previewChecked,
    surfacesSelected,
    telegramBotConnected,
  };
}

export function validateMiniAppPublish(config: TenantConfig): PublishValidationResult {
  const errors: FieldError[] = [];
  const setup = getSetupProgress(config);

  if (!config.miniApp?.publicSlug?.trim()) {
    errors.push({ path: "miniApp.publicSlug", message: "Public slug is required" });
  } else if (!SLUG_PATTERN.test(config.miniApp.publicSlug)) {
    errors.push({
      path: "miniApp.publicSlug",
      message: "Public slug must be lowercase alphanumeric with hyphens",
    });
  }

  if (!config.brand.displayName.trim()) {
    errors.push({ path: "brand.displayName", message: "Mini app name is required" });
  }

  if (!setup.hasFreeReportActive) {
    errors.push({ path: "products", message: "Free report must be enabled" });
  }

  if (!setup.hasPaidProductActive) {
    errors.push({ path: "products", message: "At least one paid product must be active" });
  }

  if (!config.miniApp?.visualPack) {
    errors.push({ path: "miniApp.visualPack", message: "Visual pack is required" });
  } else if (
    !REFERENCE_VISUAL_PACKS.includes(
      config.miniApp.visualPack as (typeof REFERENCE_VISUAL_PACKS)[number]
    )
  ) {
    errors.push({
      path: "miniApp.visualPack",
      message: "Select a reference visual pack before publishing",
    });
  }

  const miniApp = config.miniApp
    ? ensureSurfaces(config.miniApp, config.miniApp.publicSlug)
    : undefined;
  const enabledSurfaces = getEnabledSurfaces(miniApp);
  if (enabledSurfaces.length === 0) {
    errors.push({ path: "miniApp.surfaces", message: "Select at least one publication surface" });
  }

  const telegramSurface = getSurfaceByType(miniApp, "telegram_mini_app");
  if (telegramSurface && telegramSurface.status !== "disabled") {
    const tg = telegramSurface.configJson as { botStatus?: string };
    if (tg.botStatus !== "connected" && tg.botStatus !== "webhook_configured") {
      errors.push({
        path: "miniApp.surfaces.telegram",
        message: "Connect your Telegram bot before publishing the Telegram surface",
      });
    }
  }

  const websiteSurface = getSurfaceByType(miniApp, "website");
  if (websiteSurface && websiteSurface.status !== "disabled") {
    const web = websiteSurface.configJson as { slug?: string };
    if (!web.slug?.trim() || !SLUG_PATTERN.test(web.slug)) {
      errors.push({
        path: "miniApp.surfaces.website",
        message: "Website slug is required and must be lowercase alphanumeric with hyphens",
      });
    }
  }

  const mobileSurface = getSurfaceByType(miniApp, "mobile_web");
  if (mobileSurface && mobileSurface.status !== "disabled") {
    const mobile = mobileSurface.configJson as { publicUrl?: string };
    if (!mobile.publicUrl?.trim()) {
      errors.push({
        path: "miniApp.surfaces.mobile",
        message: "Mobile web public URL is required",
      });
    }
  }

  if (config.status === "paused" || config.miniApp?.publicStatus === "paused") {
    errors.push({ path: "miniApp.publicStatus", message: "Mini app is paused and cannot be published" });
  }

  const activeProductTypes = new Set(
    config.products.filter((p) => p.status === "active").map((p) => p.productType)
  );
  for (const productType of activeProductTypes) {
    if (!REAL_PRODUCT_TYPES.includes(productType)) {
      errors.push({ path: "products", message: `Unsupported product type: ${productType}` });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateSurfacePublish(
  config: TenantConfig,
  surfaceType: SurfaceType
): PublishValidationResult {
  const base = validateMiniAppPublish(config);
  const errors = [...base.errors];
  const miniApp = config.miniApp
    ? ensureSurfaces(config.miniApp, config.miniApp.publicSlug)
    : undefined;
  const surface = getSurfaceByType(miniApp, surfaceType);
  if (!surface || surface.status === "disabled") {
    errors.push({ path: `miniApp.surfaces.${surfaceType}`, message: "Surface is not enabled" });
  }
  return { valid: errors.length === 0, errors };
}

function isValidUrl(value: string | undefined): boolean {
  if (!value || value.trim() === "") return true;
  return URL_PATTERN.test(value);
}

function isValidHex(value: string | undefined): boolean {
  if (!value || value.trim() === "") return true;
  return HEX_COLOR.test(value);
}

export function getTenantConfigFieldErrors(config: TenantConfig): FieldError[] {
  const errors: FieldError[] = [];

  if (!config.brand.displayName.trim()) {
    errors.push({ path: "brand.displayName", message: "Display name is required" });
  }

  if (!config.content.home.headline.trim()) {
    errors.push({ path: "content.home.headline", message: "Home title is required" });
  }

  if (!config.content.home.ctaLabel.trim()) {
    errors.push({ path: "content.home.ctaLabel", message: "Primary CTA is required" });
  }

  const overrides = config.theme.overrides ?? {};
  if (!isValidHex(overrides.primaryColor)) {
    errors.push({ path: "theme.overrides.primaryColor", message: "Primary color must be a valid hex (#RRGGBB)" });
  }
  if (!isValidHex(overrides.accentColor)) {
    errors.push({ path: "theme.overrides.accentColor", message: "Accent color must be a valid hex (#RRGGBB)" });
  }

  for (const field of ["logoUrl", "avatarUrl", "coverUrl", "instagramUrl"] as const) {
    const value = config.brand[field];
    if (!isValidUrl(value)) {
      errors.push({ path: `brand.${field}`, message: "Must be a valid URL starting with http://" });
    }
  }

  config.content.home.faqItems?.forEach((item, index) => {
    const hasQuestion = item.question.trim().length > 0;
    const hasAnswer = item.answer.trim().length > 0;
    if (hasQuestion !== hasAnswer) {
      errors.push({
        path: `content.home.faqItems.${index}`,
        message: "FAQ items need both a question and an answer",
      });
    }
  });

  config.products.forEach((product, index) => {
    if (!product.title.trim()) {
      errors.push({ path: `products.${index}.title`, message: "Product title is required" });
    }
    if (!product.description?.trim()) {
      errors.push({ path: `products.${index}.description`, message: "Product description is required" });
    }
    const action = product.ctaAction ?? (product.ctaUrl ? "external" : undefined);
    if (action === "external" && product.ctaUrl && !isValidUrl(product.ctaUrl)) {
      errors.push({ path: `products.${index}.ctaUrl`, message: "CTA URL must be a valid link" });
    }
  });

  return errors;
}

export function getFieldError(errors: FieldError[], path: string): string | undefined {
  return errors.find((e) => e.path === path)?.message;
}
