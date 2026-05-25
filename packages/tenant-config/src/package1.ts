import type { TenantConfig, ProductConfig } from "./types";
import { createDefaultTenantConfig } from "./defaults";

/** Package 1 spec view types — mapped from runtime TenantConfig shape */

export interface TenantBrand {
  name: string;
  displayName: string;
  avatarUrl?: string;
  logoUrl?: string;
  coverUrl?: string;
  bio?: string;
  telegramUsername?: string;
  instagramUrl?: string;
}

export interface TenantTheme {
  preset: TenantConfig["theme"]["preset"];
  primaryColor?: string;
  accentColor?: string;
  background?: string;
  cardStyle?: string;
  buttonStyle?: string;
}

export interface TenantContent {
  homeTitle: string;
  homeSubtitle?: string;
  primaryCta: string;
  onboardingTitle?: string;
  onboardingSubtitle?: string;
  freeReportTitle?: string;
  reportLoadingText?: string;
  paywallTitle?: string;
  paywallSubtitle?: string;
  consultationTitle?: string;
  consultationSubtitle?: string;
  faq?: string;
}

export interface TenantModules {
  birthProfile: boolean;
  natalReport: boolean;
  compatibility: boolean;
  forecast: boolean;
  consultation: boolean;
  products: boolean;
  analytics: boolean;
  payments: boolean;
}

export interface TenantProduct {
  id: string;
  type: ProductConfig["type"];
  title: string;
  description?: string;
  priceLabel?: string;
  isActive: boolean;
  isFeatured: boolean;
  ctaLabel: string;
  ctaAction?: string;
}

export function toTenantBrand(config: TenantConfig): TenantBrand {
  return {
    name: config.brand.name ?? config.brand.displayName,
    displayName: config.brand.displayName,
    avatarUrl: config.brand.avatarUrl,
    logoUrl: config.brand.logoUrl,
    coverUrl: config.brand.coverUrl,
    bio: config.brand.bio,
    telegramUsername: config.brand.telegramUsername,
    instagramUrl: config.brand.instagramUrl,
  };
}

export function toTenantTheme(config: TenantConfig): TenantTheme {
  const overrides = config.theme.overrides ?? {};
  return {
    preset: config.theme.preset,
    primaryColor: overrides.primaryColor,
    accentColor: overrides.accentColor,
    background: overrides.backgroundType,
    cardStyle: overrides.cardStyle,
    buttonStyle: overrides.buttonStyle,
  };
}

export function toTenantContent(config: TenantConfig): TenantContent {
  return {
    homeTitle: config.content.home.headline,
    homeSubtitle: config.content.home.subheadline,
    primaryCta: config.content.home.ctaLabel,
    onboardingTitle: config.content.onboarding.welcomeText,
    onboardingSubtitle: config.content.onboarding.birthDateLabel,
    freeReportTitle: config.content.reportIntro,
    reportLoadingText: config.content.loadingMessages?.[0] ?? "Generating your reading...",
    paywallTitle: config.content.paywall?.title ?? "Unlock Full Access",
    paywallSubtitle: config.content.paywall?.subtitle ?? "Premium insights await",
    consultationTitle: config.content.home.consultationCta?.title ?? "Book a Consultation",
    consultationSubtitle: config.content.home.consultationCta?.subtitle ?? config.content.productsIntro,
    faq: undefined,
  };
}

export function toTenantModules(config: TenantConfig): TenantModules {
  return {
    birthProfile: config.modules.onboarding,
    natalReport: config.modules.freeReport,
    compatibility: config.modules.freeReport,
    forecast: config.modules.freeReport,
    consultation: config.modules.products,
    products: config.modules.products,
    analytics: config.modules.analytics?.enabled ?? false,
    payments: config.modules.payments?.enabled ?? false,
  };
}

export function toTenantProduct(product: ProductConfig): TenantProduct {
  return {
    id: product.id,
    type: product.type,
    title: product.title,
    description: product.description,
    priceLabel: product.priceLabel,
    isActive: product.status === "active",
    isFeatured: product.featured,
    ctaLabel: product.ctaLabel,
    ctaAction: product.ctaAction ?? (product.ctaUrl ? "external" : undefined),
  };
}

/** Factory alias for Package 1 spec — creates a default tenant config */
export function defaultTenantConfig(
  tenantId = "tenant_default",
  slug = "mystic-dark",
  displayName = "Mystic Astrology",
  preset: TenantConfig["theme"]["preset"] = "mystic-dark"
): TenantConfig {
  return createDefaultTenantConfig(tenantId, slug, displayName, preset);
}
