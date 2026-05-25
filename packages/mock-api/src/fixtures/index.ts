import {
  createDefaultTenantConfig,
  createDefaultMiniApp,
  type TenantConfig,
  type TenantConfigBundle,
  type TenantRecord,
  type Report,
  type BirthProfile,
  type DashboardStats,
  type AnalyticsEvent,
} from "@astro/tenant-config";
import { luxuryRuLocale, mysticRuLocale, softRuLocale } from "./locale-overrides";
export { mockReportsRu } from "./reports-ru";

const now = new Date().toISOString();

export const mockTenants: TenantRecord[] = [
  {
    id: "tenant_mystic",
    slug: "mystic-dark",
    displayName: "Mystic Veil Astrology",
    status: "active",
    ownerEmail: "mystic@mysticveil.demo.astrology.app",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tenant_soft",
    slug: "soft-feminine",
    displayName: "Rose Moon Readings",
    status: "active",
    ownerEmail: "rose@rosemoon.demo.astrology.app",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tenant_luxury",
    slug: "luxury-gold",
    displayName: "Celestial Elite",
    status: "active",
    ownerEmail: "elite@celestialelite.demo.astrology.app",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tenant_luna",
    slug: "luna-astro",
    displayName: "Luna Astro",
    status: "active",
    ownerEmail: "luna@lunaastro.demo.astrology.app",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "tenant_cosmic",
    slug: "cosmic-guide",
    displayName: "Cosmic Guide",
    status: "active",
    ownerEmail: "guide@cosmicguide.demo.astrology.app",
    createdAt: now,
    updatedAt: now,
  },
];

function publishConfig(config: TenantConfig): TenantConfig {
  return {
    ...structuredClone(config),
    version: config.version,
    publishedAt: new Date().toISOString(),
    meta: {
      ...config.meta,
      createdAt: config.meta?.createdAt ?? now,
      updatedAt: new Date().toISOString(),
    },
  };
}

const lunaDraft = createDefaultTenantConfig("tenant_luna", "luna-astro", "Luna Astro", "pink-moon");
lunaDraft.content.home.headline = "Unlock Your Moon Magic";
lunaDraft.content.home.subheadline = "Personalized insights guided by the stars.";
lunaDraft.brand.tagline = "Where intuition meets the cosmos";
lunaDraft.content.home.whatYouReceive = [
  { id: "w1", title: "Moon Snapshot", text: "Your emotional signature and intuitive strengths at a glance." },
  { id: "w2", title: "Current Lunar Theme", text: "What this season invites you to feel, release, or embrace." },
  { id: "w3", title: "Path Forward", text: "Curated suggestions for deeper readings when you are ready." },
];
lunaDraft.content.home.faqItems = [
  {
    question: "How long does generation take?",
    answer: "Your free report is prepared in moments — a brief, premium loading experience while we assemble your insights.",
  },
];
lunaDraft.content.home.consultationCta = {
  title: "Book a Personal Consultation",
  subtitle: "One-on-one guidance with Luna Astro.",
  enabled: true,
};
lunaDraft.content.loadingMessages = [
  "Analyzing your birth profile...",
  "Reading key planetary patterns...",
  "Preparing your personal insight...",
  "Building your free report...",
];

const cosmicDraft = createDefaultTenantConfig(
  "tenant_cosmic",
  "cosmic-guide",
  "Cosmic Guide",
  "cosmic-violet"
);
cosmicDraft.content.home.headline = "Navigate Your Cosmic Blueprint";
cosmicDraft.content.home.subheadline = "Clarity for your next chapter, written in the stars.";
cosmicDraft.brand.tagline = "Ancient wisdom, modern guidance";
cosmicDraft.brand.name = "Orion Kepler";
cosmicDraft.brand.bio = "Visionary astrology for innovators and changemakers ready to align with their cosmic purpose.";
cosmicDraft.modules.onboarding = true;
cosmicDraft.modules.freeReport = true;
cosmicDraft.modules.products = true;
cosmicDraft.modules.profile = true;

const mysticDraft = createDefaultTenantConfig(
  "tenant_mystic",
  "mystic-dark",
  "Mystic Veil Astrology",
  "mystic-dark"
);
mysticDraft.content.home.headline = "Reveal Your Cosmic Blueprint";
mysticDraft.content.home.subheadline = "Ancient symbols. Modern clarity. For seekers of insight.";
mysticDraft.content.home.ctaLabel = "Reveal My Chart";
mysticDraft.brand.name = "Seraphina Vale";
mysticDraft.brand.tagline = "Where shadow meets starlight";
mysticDraft.brand.bio = "Tarot-infused natal readings for the spiritually curious. Seraphina guides seekers through shadow work and celestial symbolism.";
mysticDraft.brand.avatarUrl =
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop";
mysticDraft.brand.coverUrl =
  "https://images.unsplash.com/photo-1462336530614-9b09155c37a8?w=800&h=400&fit=crop";
mysticDraft.brand.telegramUsername = "mysticveil_bot";
mysticDraft.modules.onboarding = true;
mysticDraft.modules.freeReport = true;
mysticDraft.modules.products = true;
mysticDraft.modules.profile = true;
mysticDraft.content.home.whatYouReceive = [
  { id: "w1", title: "Shadow Snapshot", text: "Key themes from your natal chart distilled into clear language." },
  { id: "w2", title: "Planetary Patterns", text: "Highlights of your strongest cosmic influences right now." },
  { id: "w3", title: "Next Step Guidance", text: "A gentle nudge toward deeper offerings when you are ready." },
];
mysticDraft.content.home.faqItems = [
  {
    question: "Is this reading personalized?",
    answer: "Yes — your free report is built from the birth details you share during onboarding.",
  },
  {
    question: "Do I need my exact birth time?",
    answer: "Birth time improves accuracy, but you can still receive meaningful insights without it.",
  },
];
mysticDraft.content.home.consultationCta = {
  title: "Premium-разбор",
  subtitle: "Live guidance blending astrology and intuitive work.",
  enabled: true,
};
mysticDraft.content.loadingMessages = [
  "Analyzing your birth profile...",
  "Reading key planetary patterns...",
  "Preparing your personal insight...",
  "Building your free report...",
];

mysticDraft.locales = { ru: mysticRuLocale };
mysticDraft.miniApp = {
  ...createDefaultMiniApp("nicole", "pink_love"),
  publicSlug: "nicole",
  defaultTopic: "relationships",
  publicStatus: "published",
  introCopy:
    "Астролог Nicole — мягкий вход в тему отношений через бесплатный мини-разбор.",
  welcomeMessage:
    "Добро пожаловать! Выберите тему и получите персональный мини-разбор.",
};

const softDraft = createDefaultTenantConfig(
  "tenant_soft",
  "soft-feminine",
  "Rose Moon Readings",
  "soft-feminine"
);
softDraft.content.home.headline = "Your Heart Knows the Way";
softDraft.content.home.subheadline = "Gentle astrology for soulful women on their journey.";
softDraft.content.home.ctaLabel = "Start My Reading";
softDraft.brand.name = "Rose Hartwell";
softDraft.brand.tagline = "Soft guidance for tender hearts";
softDraft.brand.bio = "Feminine-centered astrology with compassion at the core. Rose helps soulful women navigate love, boundaries, and self-worth.";
softDraft.brand.avatarUrl =
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop";
softDraft.brand.coverUrl =
  "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop";
softDraft.brand.instagramUrl = "https://instagram.com/rosemoonreadings";
softDraft.modules.onboarding = true;
softDraft.modules.freeReport = true;
softDraft.modules.products = true;
softDraft.modules.profile = false;
softDraft.content.home.whatYouReceive = [
  { id: "w1", title: "Heart-Centered Overview", text: "A nurturing read on your emotional patterns and needs." },
  { id: "w2", title: "Relationship Themes", text: "Gentle insight into love, boundaries, and self-worth." },
  { id: "w3", title: "Soft Next Steps", text: "Suggestions aligned with your chosen life topic." },
];
softDraft.content.home.faqItems = [
  {
    question: "What topic should I choose?",
    answer: "Pick the area where you want the most clarity — relationships, purpose, career, and more.",
  },
  {
    question: "Is my reading private?",
    answer: "Yes. Your birth details and readings are kept confidential and used only to personalize your experience.",
  },
  {
    question: "Can I book a live session?",
    answer: "Premium-разбор доступен как ручная заявка — оставьте запрос на странице продукта.",
  },
];
softDraft.content.home.consultationCta = {
  title: "Premium-разбор",
  subtitle: "Личный запрос с ручной обработкой экспертом.",
  enabled: true,
};
softDraft.content.loadingMessages = [
  "Tuning into your heart chart...",
  "Reading your emotional patterns...",
  "Weaving your personal insight...",
  "Preparing your free reading...",
];

softDraft.locales = { ru: softRuLocale };

const luxuryDraft = createDefaultTenantConfig(
  "tenant_luxury",
  "luxury-gold",
  "Celestial Elite",
  "luxury-gold"
);
luxuryDraft.content.home.headline = "Your Destiny, Curated";
luxuryDraft.content.home.subheadline = "Bespoke astrological counsel for discerning clients.";
luxuryDraft.content.home.ctaLabel = "Request Private Reading";
luxuryDraft.brand.name = "Alexandra Sterling";
luxuryDraft.brand.tagline = "Premium celestial advisory";
luxuryDraft.brand.bio = "White-glove astrology for executives and creatives. Alexandra delivers bespoke counsel with discretion and precision.";
luxuryDraft.brand.avatarUrl =
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop";
luxuryDraft.brand.coverUrl =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop";
luxuryDraft.brand.telegramUsername = "celestialelite_bot";
luxuryDraft.modules.onboarding = true;
luxuryDraft.modules.freeReport = true;
luxuryDraft.modules.products = true;
luxuryDraft.modules.profile = true;
luxuryDraft.content.home.whatYouReceive = [
  { id: "w1", title: "Executive Snapshot", text: "A concise overview of your chart's strategic strengths and timing windows." },
  { id: "w2", title: "Priority Themes", text: "Key planetary patterns influencing decisions in the next 90 days." },
  { id: "w3", title: "Private Path Forward", text: "Curated recommendations for VIP consultations when you're ready." },
];
luxuryDraft.content.home.faqItems = [
  {
    question: "Who is this service for?",
    answer: "Discerning clients seeking confidential, high-touch astrological counsel — executives, founders, and creatives.",
  },
  {
    question: "How quickly will I receive my reading?",
    answer: "Your complimentary snapshot is prepared instantly. VIP dossiers are delivered within 48 hours of booking.",
  },
  {
    question: "Is everything confidential?",
    answer: "Absolutely. All sessions and reports are handled with complete discretion.",
  },
];
luxuryDraft.content.home.consultationCta = {
  title: "Reserve a VIP Consultation",
  subtitle: "Private 90-minute session with full chart analysis.",
  enabled: true,
};
luxuryDraft.content.loadingMessages = [
  "Reviewing your birth profile...",
  "Mapping executive planetary patterns...",
  "Preparing your private snapshot...",
  "Finalizing your complimentary reading...",
];

luxuryDraft.locales = { ru: luxuryRuLocale };

export const mockTenantConfigs: Record<string, TenantConfigBundle> = {
  tenant_mystic: {
    draft: mysticDraft,
    published: publishConfig(mysticDraft),
  },
  tenant_soft: {
    draft: softDraft,
    published: publishConfig(softDraft),
  },
  tenant_luxury: {
    draft: luxuryDraft,
    published: publishConfig(luxuryDraft),
  },
  tenant_luna: (() => {
    const lunaPublished = publishConfig(lunaDraft);
    lunaPublished.content.home.headline = "Welcome to Luna Astro";
    lunaPublished.content.home.subheadline = "Your personalized astrology journey starts here.";
    const lunaDraftUnpublished = structuredClone(lunaDraft);
    lunaDraftUnpublished.content.home.headline = "Unlock Your Moon Magic (Draft)";
    lunaDraftUnpublished.meta = {
      ...lunaDraftUnpublished.meta!,
      updatedAt: new Date(Date.now() + 1000).toISOString(),
    };
    return {
      draft: lunaDraftUnpublished,
      published: lunaPublished,
    };
  })(),
  tenant_cosmic: {
    draft: cosmicDraft,
    published: publishConfig(cosmicDraft),
  },
};

export const mockReports: Record<string, Report> = {
  tenant_mystic: {
    id: "report_mystic_free",
    type: "natal",
    title: "Your Shadow Snapshot",
    subtitle: "A glimpse beneath the surface",
    summary:
      "Your chart reveals a seeker drawn to depth and transformation. This free reading illuminates the patterns shaping your inner world.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Scorpio", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Pisces", icon: "moon" },
      { id: "h3", label: "Rising", value: "Capricorn", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Core Essence",
        content:
          "You navigate life through intuition and intensity. Your gift is seeing what others overlook — the shadow holds your power.",
        order: 0,
        variant: "highlight",
        access: "free",
      },
      {
        id: "s2",
        title: "Current Cycle",
        content:
          "A season of release is opening. Trust the quiet moments; they are preparing you for a more authentic expression.",
        order: 1,
        access: "free",
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Денежный код",
        teaser: "Полный разбор показывает сценарии, причины и практические выводы по выбранной теме...",
        unlockProductId: "mystic-dark-money-code",
      },
    ],
    cta: {
      label: "Сравнить продукты",
      title: "Пойти глубже",
      subtitle: "Откройте полные сценарии и практические выводы",
      buttonLabel: "К услугам",
      action: "navigate_products",
    },
    recommendedProducts: [
      "mystic-dark-money-code",
      "mystic-dark-bundle-three-topics",
      "mystic-dark-full-natal-portrait",
    ],
  },
  tenant_soft: {
    id: "report_soft_free",
    type: "free",
    title: "Your Heart Reading",
    subtitle: "Gentle insight for your chosen path",
    summary:
      "Your birth profile speaks to a soul that leads with empathy. This overview honors your emotional wisdom and natural nurturing gifts.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Taurus", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Cancer", icon: "moon" },
      { id: "h3", label: "Rising", value: "Libra", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Emotional Landscape",
        content:
          "You create safety for others through warmth and presence. Remember to extend that same tenderness inward.",
        order: 0,
        variant: "quote",
        access: "free",
      },
      {
        id: "s2",
        title: "Topic Focus",
        content:
          "The area you selected is calling for gentle attention. Small, consistent steps will bring more clarity than force.",
        order: 1,
        access: "free",
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Код отношений",
        teaser: "Полный разбор показывает сценарии близости и повторяющиеся паттерны...",
        unlockProductId: "soft-feminine-relationships-code",
      },
    ],
    cta: {
      label: "Сравнить продукты",
      action: "navigate_products",
    },
    recommendedProducts: [
      "soft-feminine-relationships-code",
      "soft-feminine-bundle-three-topics",
      "soft-feminine-full-natal-portrait",
    ],
  },
  tenant_luna: {
    id: "report_luna_free",
    type: "free",
    title: "Your Moon Snapshot",
    subtitle: "A glimpse into your emotional landscape",
    summary:
      "Your birth profile reveals a strong intuitive nature and a deep connection to lunar cycles. This free reading highlights key themes in your chart.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Cancer", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Pisces", icon: "moon" },
      { id: "h3", label: "Rising", value: "Scorpio", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Emotional Core",
        content:
          "You feel deeply and absorb the energy around you. Your emotional world is rich, creative, and sometimes overwhelming — but it is your greatest gift.",
        order: 0,
        variant: "highlight",
      },
      {
        id: "s2",
        title: "Current Theme",
        content:
          "This season invites you to trust your intuition and release what no longer serves your growth. Small rituals will amplify your clarity.",
        order: 1,
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Личностный портрет",
        teaser: "Полный разбор раскрывает ядро личности, сильные стороны и зону роста...",
        unlockProductId: "luna-astro-personality-portrait",
      },
    ],
    cta: {
      label: "Сравнить продукты",
      action: "navigate_products",
    },
    recommendedProducts: [
      "luna-astro-personality-portrait",
      "luna-astro-bundle-three-topics",
      "luna-astro-full-natal-portrait",
    ],
  },
  tenant_cosmic: {
    id: "report_cosmic_free",
    type: "free",
    title: "Your Cosmic Overview",
    subtitle: "Key patterns in your birth chart",
    summary:
      "Your chart points to a visionary spirit with a drive for meaningful transformation. This overview captures your core energetic signature.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Aquarius", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Capricorn", icon: "moon" },
      { id: "h3", label: "Rising", value: "Gemini", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Life Purpose Signal",
        content:
          "You are here to innovate and challenge the status quo. Your unique perspective is not a flaw — it is your compass.",
        order: 0,
        variant: "quote",
      },
      {
        id: "s2",
        title: "Strengths",
        content:
          "Strategic thinking, adaptability, and the ability to see connections others miss. Lean into these when making big decisions.",
        order: 1,
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Full Astrological Portrait",
        teaser: "Your complete natal portrait covers all houses and aspects — available as a dedicated product...",
        unlockProductId: "cosmic-guide-full-natal-portrait",
      },
    ],
    cta: {
      label: "See All Offerings",
      action: "navigate_products",
    },
    recommendedProducts: [
      "cosmic-guide-premium-consultation",
      "cosmic-guide-full-natal-portrait",
      "cosmic-guide-bundle-three-topics",
    ],
  },
  tenant_luxury: {
    id: "report_luxury_free",
    type: "free",
    title: "Your Executive Snapshot",
    subtitle: "A private glimpse into your celestial strategy",
    summary:
      "Your chart reveals a leader calibrated for precision and long-range vision. This complimentary snapshot highlights the patterns shaping your next strategic window.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Sun Sign", value: "Capricorn", icon: "sun" },
      { id: "h2", label: "Moon Sign", value: "Virgo", icon: "moon" },
      { id: "h3", label: "Rising", value: "Leo", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Leadership Signature",
        content:
          "You lead through structure and quiet authority. Your chart favors decisions backed by research, timing, and strategic patience.",
        order: 0,
        variant: "highlight",
        access: "free",
      },
      {
        id: "s2",
        title: "Current Window",
        content:
          "The next quarter favors consolidation over expansion. Refine what works before scaling — your chart rewards disciplined focus.",
        order: 1,
        access: "free",
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Premium-разбор",
        teaser: "Индивидуальный разбор с живым астрологом — персональный формат для вашего запроса...",
        unlockProductId: "luxury-gold-premium-consultation",
      },
    ],
    cta: {
      label: "Explore offerings",
      title: "Go deeper",
      subtitle: "Full portrait and Premium consultation",
      buttonLabel: "View Offerings",
      action: "navigate_products",
    },
    recommendedProducts: [
      "luxury-gold-premium-consultation",
      "luxury-gold-full-natal-portrait",
      "luxury-gold-bundle-three-topics",
    ],
  },
};

export const mockUsers: Record<string, BirthProfile> = {};

export const mockDashboardStats: Record<string, DashboardStats> = {
  tenant_mystic: {
    totalSessions: 2100,
    reportsGenerated: 1450,
    productClicks: 312,
    lastPublishedAt: now,
  },
  tenant_soft: {
    totalSessions: 1680,
    reportsGenerated: 1120,
    productClicks: 245,
    lastPublishedAt: now,
  },
  tenant_luxury: {
    totalSessions: 420,
    reportsGenerated: 180,
    productClicks: 89,
    lastPublishedAt: now,
  },
  tenant_luna: {
    totalSessions: 1240,
    reportsGenerated: 890,
    productClicks: 156,
    lastPublishedAt: now,
  },
  tenant_cosmic: {
    totalSessions: 980,
    reportsGenerated: 720,
    productClicks: 98,
    lastPublishedAt: now,
  },
};

export const mockAnalyticsEvents: AnalyticsEvent[] = [];
