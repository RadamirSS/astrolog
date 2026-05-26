export type TenantStatus = "draft" | "active" | "paused";

export type ThemePreset =
  | "mystic-dark"
  | "soft-feminine"
  | "cosmic-violet"
  | "luxury-gold"
  | "minimal-white"
  | "pink-moon";

export type BackgroundType = "solid" | "gradient" | "image";
export type CardStyle = "flat" | "elevated" | "glass";
export type ButtonStyle = "rounded" | "pill" | "sharp";
export type ProductType =
  | "consultation"
  | "report"
  | "course"
  | "natal"
  | "compatibility"
  | "forecast"
  | "custom";

export type ProductCtaAction =
  | "telegram"
  | "whatsapp"
  | "external"
  | "request"
  | "coming-soon";

export type ProductStatus = "active" | "hidden";

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  consultation: "Consultation",
  report: "Report",
  course: "Course",
  natal: "Natal Chart",
  compatibility: "Compatibility",
  forecast: "Forecast",
  custom: "Custom Service",
};

export const PRODUCT_CTA_ACTION_LABELS: Record<ProductCtaAction, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  external: "External Link",
  request: "Request Info",
  "coming-soon": "Coming Soon",
};

/** Funnel entry topics — topic-first landing */
export type FunnelTopic = "money" | "relationships" | "personality";

export const FUNNEL_TOPICS: FunnelTopic[] = ["money", "relationships", "personality"];

export const FUNNEL_TOPIC_LABELS: Record<FunnelTopic, string> = {
  money: "Money",
  relationships: "Relationships",
  personality: "Personality",
};

/** @deprecated Use FunnelTopic — kept as alias for birth profile topic field */
export type BirthProfileTopic = FunnelTopic;

export const BIRTH_PROFILE_TOPICS: BirthProfileTopic[] = FUNNEL_TOPICS;

export const BIRTH_PROFILE_TOPIC_LABELS: Record<BirthProfileTopic, string> =
  FUNNEL_TOPIC_LABELS;

export type ProductLevel = "free" | "low_ticket" | "bundle" | "main" | "premium";

export type RealProductType =
  | "free_report"
  | "low_ticket_money"
  | "low_ticket_relationships"
  | "low_ticket_personality"
  | "bundle_all_topics"
  | "main_natal_portrait"
  | "premium_consultation";

export const REAL_PRODUCT_TYPES: RealProductType[] = [
  "free_report",
  "low_ticket_money",
  "low_ticket_relationships",
  "low_ticket_personality",
  "bundle_all_topics",
  "main_natal_portrait",
  "premium_consultation",
];

export type VisualPack =
  | "sky_clarity"
  | "dark_gold_mystic"
  | "pink_love"
  | "cosmic_pastel"
  | "brand_default";

export type BirthTimeAccuracy = "exact" | "approximate" | "unknown";

export type ReportStatus =
  | "draft"
  | "queued"
  | "generating"
  | "ready"
  | "failed"
  | "locked"
  | "paid_pending";

export type ReportLibraryStatus =
  | "locked"
  | "pending_payment"
  | "paid_generating"
  | "ready"
  | "failed"
  | "revoked";

export type ReportSectionType =
  | "hero"
  | "planet_card"
  | "insight"
  | "summary"
  | "locked_preview"
  | "cta"
  | "disclaimer";

export type ReportActionType =
  | "buy_product"
  | "open_product"
  | "open_paywall"
  | "download_pdf"
  | "request_premium";

export interface ThemeOverrides {
  primaryColor?: string;
  accentColor?: string;
  backgroundType?: BackgroundType;
  backgroundImageUrl?: string;
  cardStyle?: CardStyle;
  buttonStyle?: ButtonStyle;
  heroImageUrl?: string;
}

export interface ProductFaqItem {
  question: string;
  answer: string;
}

export interface ProductConfig {
  id: string;
  slug: string;
  type: ProductType;
  productType: RealProductType;
  level: ProductLevel;
  theme?: FunnelTopic;
  title: string;
  subtitle?: string;
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  whatUserWillUnderstand?: string[];
  reportOutline?: string[];
  recommendedFor?: string[];
  notFor?: string[];
  estimatedPages?: string;
  primaryCTA?: string;
  faq?: ProductFaqItem[];
  disclaimer?: string;
  price?: number;
  priceLabel?: string;
  visualPack: VisualPack;
  format?: string;
  includes?: string[];
  excludes?: string[];
  ctaLabel: string;
  ctaAction?: ProductCtaAction;
  ctaUrl?: string;
  featured: boolean;
  sortOrder: number;
  status: ProductStatus;
}

export type MiniAppPublicStatus = "draft" | "published" | "paused";

export type SurfaceType = "telegram_mini_app" | "website" | "mobile_web";

export type SurfaceStatus = "disabled" | "draft" | "configured" | "published" | "error";

export type TelegramBotStatus =
  | "not_connected"
  | "connected"
  | "invalid_token"
  | "webhook_configured"
  | "error";

export interface TelegramSurfaceConfig {
  botIntegrationId?: string;
  botUsername?: string;
  botDisplayName?: string;
  botStatus: TelegramBotStatus;
  miniAppUrl?: string;
  deepLink?: string;
  webhookStatus?: "pending" | "configured" | "error";
  lastValidatedAt?: string;
  errorMessage?: string;
}

export interface WebsiteSurfaceConfig {
  slug: string;
  publicUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  status?: SurfaceStatus;
  previewUrl?: string;
}

export interface MobileWebSurfaceConfig {
  publicUrl?: string;
  installableHintEnabled?: boolean;
  bottomNavEnabled?: boolean;
  status?: SurfaceStatus;
}

export type SurfaceConfigJson =
  | TelegramSurfaceConfig
  | WebsiteSurfaceConfig
  | MobileWebSurfaceConfig;

export interface SurfaceConfig {
  id: string;
  type: SurfaceType;
  status: SurfaceStatus;
  publicUrl?: string;
  previewUrl?: string;
  configJson: SurfaceConfigJson;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface MiniAppConfig {
  publicSlug: string;
  visualPack: VisualPack;
  defaultTopic: FunnelTopic | null;
  publicStatus: MiniAppPublicStatus;
  partnerId?: string;
  partnerSlug?: string;
  partnerName?: string;
  partnerStatus?: "active" | "paused" | "blocked";
  campaignId?: string;
  introCopy?: string;
  welcomeMessage?: string;
  promoCtaCopy?: string;
}

/** Extended mini app config with multi-surface publishing */
export interface CreatorMiniAppConfig extends MiniAppConfig {
  name?: string;
  surfaces?: SurfaceConfig[];
}

export type AppLocaleCode = "en" | "ru";

export interface TenantLocaleProductOverride {
  title?: string;
  description?: string;
  priceLabel?: string;
  ctaLabel?: string;
}

export interface TenantLocaleHomeOverride {
  headline?: string;
  subheadline?: string;
  ctaLabel?: string;
  whatYouReceive?: Array<{ id: string; title: string; text: string }>;
  faqItems?: Array<{ question: string; answer: string }>;
  consultationCta?: { title: string; subtitle?: string; enabled: boolean };
}

export interface TenantLocaleContentOverride {
  home?: TenantLocaleHomeOverride;
  onboarding?: {
    welcomeText?: string;
    birthDateLabel?: string;
    birthTimeLabel?: string;
    birthPlaceLabel?: string;
    topicLabel?: string;
    stepsIntro?: string;
  };
  reportIntro?: string;
  productsIntro?: string;
  paywall?: { title: string; subtitle?: string };
  profileLabels?: Record<string, string>;
  loadingMessages?: string[];
}

export interface TenantLocaleBrandOverride {
  displayName?: string;
  name?: string;
  tagline?: string;
  bio?: string;
}

export interface TenantLocaleOverrides {
  brand?: TenantLocaleBrandOverride;
  content?: TenantLocaleContentOverride;
  products?: Record<string, TenantLocaleProductOverride>;
}

export interface TenantConfig {
  tenantId: string;
  slug: string;
  status: TenantStatus;
  version: number;
  publishedAt?: string;
  brand: {
    displayName: string;
    name?: string;
    tagline?: string;
    logoUrl?: string;
    avatarUrl?: string;
    coverUrl?: string;
    bio?: string;
    telegramUsername?: string;
    instagramUrl?: string;
    supportEmail?: string;
  };
  theme: {
    preset: ThemePreset;
    overrides?: ThemeOverrides;
  };
  content: {
    home: {
      headline: string;
      subheadline?: string;
      ctaLabel: string;
      whatYouReceive?: Array<{ id: string; title: string; text: string }>;
      faqItems?: Array<{ question: string; answer: string }>;
      consultationCta?: { title: string; subtitle?: string; enabled: boolean };
    };
    onboarding: {
      welcomeText?: string;
      birthDateLabel?: string;
      birthTimeLabel?: string;
      birthPlaceLabel?: string;
      topicLabel?: string;
      stepsIntro?: string;
    };
    reportIntro?: string;
    productsIntro?: string;
    paywall?: { title: string; subtitle?: string };
    profileLabels?: Record<string, string>;
    loadingMessages?: string[];
  };
  modules: {
    onboarding: boolean;
    freeReport: boolean;
    products: boolean;
    profile: boolean;
    payments?: { enabled: false };
    telegram?: { botConnected: false };
    analytics?: { enabled: false };
  };
  products: ProductConfig[];
  miniApp?: CreatorMiniAppConfig;
  locales?: {
    ru?: TenantLocaleOverrides;
  };
  meta?: {
    createdAt: string;
    updatedAt: string;
    createdBy?: string;
  };
}

export interface TenantConfigBundle {
  draft: TenantConfig;
  published: TenantConfig | null;
}

export type IntegrationModuleStatus =
  | "not_configured"
  | "coming_later"
  | "mock_only"
  | "active"
  | "error";

export type ConfigChangedArea = "brand" | "design" | "content" | "products" | "modules";

export interface TenantConfigStatus {
  hasUnpublishedChanges: boolean;
  draftUpdatedAt: string;
  lastPublishedAt?: string;
  publishedVersion?: number;
  draftVersion: number;
  changedAreas: ConfigChangedArea[];
}

export interface TenantRecord {
  id: string;
  slug: string;
  displayName: string;
  status: TenantStatus;
  ownerEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface BirthProfile {
  userId: string;
  tenantId: string;
  name: string;
  birthDate: string;
  birthTime?: string | null;
  timeAccuracy: BirthTimeAccuracy;
  birthPlace: string;
  topic?: FunnelTopic;
  locale?: AppLocaleCode;
  createdAt: string;
}

export interface ReportHighlight {
  id: string;
  label?: string;
  value?: string;
  title?: string;
  text?: string;
  icon?: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  order: number;
  variant?: "default" | "quote" | "highlight";
  access?: "free" | "locked" | "paid";
  icon?: string;
}

export interface LockedSection {
  id: string;
  title: string;
  teaser: string;
  unlockProductId?: string;
}

export interface Report {
  id: string;
  type: "free" | "natal" | "compatibility" | "forecast" | "custom";
  title: string;
  subtitle?: string;
  summary: string;
  generatedAt: string;
  highlights: ReportHighlight[];
  sections: ReportSection[];
  lockedSections?: LockedSection[];
  cta?: {
    label: string;
    title?: string;
    subtitle?: string;
    buttonLabel?: string;
    target?: string;
    productId?: string;
    action: "navigate_products" | "external_url";
    url?: string;
  };
  recommendedProducts?: string[];
}

export interface ReportSectionV2 {
  id: string;
  type: ReportSectionType;
  title: string;
  content: string;
  order: number;
  subtitle?: string;
  icon?: string;
  planet?: "sun" | "moon" | "ascendant";
  uncertain?: boolean;
  productId?: string;
}

export interface ReportAction {
  id: string;
  type: ReportActionType;
  label: string;
  productId?: string;
  productType?: RealProductType;
  url?: string;
}

export interface ReportV2 {
  schemaVersion: 2;
  id: string;
  productType: RealProductType;
  level: ProductLevel;
  theme?: FunnelTopic;
  title: string;
  subtitle?: string;
  visualPack: VisualPack;
  status: ReportStatus;
  birthProfileId?: string;
  sections: ReportSectionV2[];
  actions?: ReportAction[];
  pdfUrl?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export type AnyReport = Report | ReportV2;

export function isReportV2(report: AnyReport): report is ReportV2 {
  return "schemaVersion" in report && report.schemaVersion === 2;
}

export interface ReportLibraryItem {
  id: string;
  productType: RealProductType;
  productId: string;
  title: string;
  status: ReportLibraryStatus;
  theme?: FunnelTopic;
  reportId?: string;
  pdfUrl?: string | null;
  premiumRequestId?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalSessions: number;
  reportsGenerated: number;
  productClicks: number;
  lastPublishedAt?: string;
}

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  name: string;
  payload?: Record<string, unknown>;
  timestamp: string;
}
