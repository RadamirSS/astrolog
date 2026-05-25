import type {
  FunnelTopic,
  ProductConfig,
  ProductLevel,
  RealProductType,
  VisualPack,
} from "./types";
import { CATALOG_CONTENT_EXTRAS } from "./product-catalog-content";

export interface CatalogProductDef {
  productType: RealProductType;
  level: ProductLevel;
  theme?: FunnelTopic;
  slug: string;
  titleRu: string;
  titleEn: string;
  subtitleRu?: string;
  subtitleEn?: string;
  descriptionRu: string;
  descriptionEn: string;
  price: number;
  priceLabelRu: string;
  priceLabelEn: string;
  visualPack: VisualPack;
  formatRu: string;
  formatEn: string;
  includesRu: string[];
  includesEn: string[];
  excludesRu: string[];
  excludesEn: string[];
  ctaLabelRu: string;
  ctaLabelEn: string;
  featured: boolean;
  sortOrder: number;
  legacyType: ProductConfig["type"];
}

export const DEFAULT_VISUAL_PACK_BY_PRODUCT_TYPE: Record<RealProductType, VisualPack> = {
  free_report: "sky_clarity",
  low_ticket_money: "dark_gold_mystic",
  low_ticket_relationships: "pink_love",
  low_ticket_personality: "cosmic_pastel",
  bundle_all_topics: "cosmic_pastel",
  main_natal_portrait: "dark_gold_mystic",
  premium_consultation: "dark_gold_mystic",
};

export const REAL_PRODUCT_CATALOG: CatalogProductDef[] = [
  {
    productType: "free_report",
    level: "free",
    slug: "free-mini-report",
    titleRu: "Мини-разбор",
    titleEn: "Mini Report",
    subtitleRu: "Первое знакомство с вашей картой",
    subtitleEn: "Your first chart snapshot",
    descriptionRu:
      "Короткий персональный разбор по Солнцу, Луне и Асценденту — первый шаг к глубокому пониманию себя.",
    descriptionEn:
      "A short personalized reading on Sun, Moon, and Ascendant — your first step toward deeper self-understanding.",
    price: 0,
    priceLabelRu: "Бесплатно",
    priceLabelEn: "Free",
    visualPack: "sky_clarity",
    formatRu: "Веб-разбор",
    formatEn: "Web report",
    includesRu: ["Солнце", "Луна", "Асцендент", "Ключевой инсайт", "CTA к углублённому продукту"],
    includesEn: ["Sun", "Moon", "Ascendant", "Key insight", "CTA to deeper product"],
    excludesRu: ["Полный PDF", "Глубокий разбор по теме"],
    excludesEn: ["Full PDF", "Deep topic reading"],
    ctaLabelRu: "Получить мини-разбор",
    ctaLabelEn: "Get Mini Report",
    featured: true,
    sortOrder: 0,
    legacyType: "report",
  },
  {
    productType: "low_ticket_money",
    level: "low_ticket",
    theme: "money",
    slug: "money-code",
    titleRu: "Денежный код",
    titleEn: "Money Code",
    subtitleRu: "Понимание денежных и ресурсных сценариев",
    subtitleEn: "Understand money and resource patterns",
    descriptionRu:
      "Глубокий разбор ваших денежных паттернов, блоков и возможностей через натальную карту.",
    descriptionEn:
      "Deep reading of your money patterns, blocks, and opportunities through your natal chart.",
    price: 29,
    priceLabelRu: "$29",
    priceLabelEn: "$29",
    visualPack: "dark_gold_mystic",
    formatRu: "Веб-разбор + PDF (скоро)",
    formatEn: "Web report + PDF (coming soon)",
    includesRu: [
      "15–20 страниц разбора",
      "Денежные дома и планеты",
      "Ресурсные сценарии",
      "Рекомендации по росту",
    ],
    includesEn: [
      "15–20 page reading",
      "Money houses and planets",
      "Resource scenarios",
      "Growth recommendations",
    ],
    excludesRu: [
      "Инвестиционные советы",
      "Юридические и налоговые советы",
      "Гарантированный прогноз дохода",
      "Точный финансовый прогноз",
      "Персональный бизнес-план",
    ],
    excludesEn: [
      "Investment advice",
      "Legal and tax advice",
      "Guaranteed income prediction",
      "Exact financial forecast",
      "Personal business plan",
    ],
    ctaLabelRu: "Получить Денежный код",
    ctaLabelEn: "Get Money Code",
    featured: true,
    sortOrder: 1,
    legacyType: "report",
  },
  {
    productType: "low_ticket_relationships",
    level: "low_ticket",
    theme: "relationships",
    slug: "relationships-code",
    titleRu: "Код отношений",
    titleEn: "Relationships Code",
    subtitleRu: "Любовь, близость и повторяющиеся паттерны",
    subtitleEn: "Love, closeness, and repeating patterns",
    descriptionRu:
      "Разбор ваших отношенческих сценариев: что притягиваете, что ищете внутри и как строите близость.",
    descriptionEn:
      "Reading of your relationship patterns: what you attract, what you seek inside, and how you build closeness.",
    price: 29,
    priceLabelRu: "$29",
    priceLabelEn: "$29",
    visualPack: "pink_love",
    formatRu: "Веб-разбор + PDF (скоро)",
    formatEn: "Web report + PDF (coming soon)",
    includesRu: [
      "15–20 страниц разбора",
      "Венера и Луна в отношениях",
      "Паттерны привязанности",
      "Рекомендации по гармонии",
    ],
    includesEn: [
      "15–20 page reading",
      "Venus and Moon in relationships",
      "Attachment patterns",
      "Harmony recommendations",
    ],
    excludesRu: [
      "Синастрия с конкретным человеком",
      "Прогноз даты свадьбы",
      "Гарантированный исход отношений",
      "Психотерапия и медицинские советы",
    ],
    excludesEn: [
      "Compatibility with a specific person",
      "Marriage date prediction",
      "Guaranteed relationship outcome",
      "Psychotherapy and medical advice",
    ],
    ctaLabelRu: "Получить Код отношений",
    ctaLabelEn: "Get Relationships Code",
    featured: true,
    sortOrder: 2,
    legacyType: "report",
  },
  {
    productType: "low_ticket_personality",
    level: "low_ticket",
    theme: "personality",
    slug: "personality-portrait",
    titleRu: "Личностный портрет",
    titleEn: "Personality Portrait",
    subtitleRu: "Ядро личности, сильные стороны и зона роста",
    subtitleEn: "Personality core, strengths, and growth zone",
    descriptionRu:
      "Глубокий портрет вашей личности: суть, таланты, внутренние противоречия и направление развития.",
    descriptionEn:
      "Deep portrait of your personality: essence, talents, inner contrasts, and direction for growth.",
    price: 29,
    priceLabelRu: "$29",
    priceLabelEn: "$29",
    visualPack: "cosmic_pastel",
    formatRu: "Веб-разбор + PDF (скоро)",
    formatEn: "Web report + PDF (coming soon)",
    includesRu: [
      "15–20 страниц разбора",
      "Солнце, Луна, Асцендент",
      "Сильные стороны и тени",
      "Зона роста",
    ],
    includesEn: [
      "15–20 page reading",
      "Sun, Moon, Ascendant",
      "Strengths and shadows",
      "Growth zone",
    ],
    excludesRu: [
      "Медицинская или психологическая диагностика",
      "Гарантия судьбы",
      "Точный прогноз событий жизни",
    ],
    excludesEn: [
      "Medical or psychological diagnosis",
      "Fate guarantee",
      "Exact prediction of life events",
    ],
    ctaLabelRu: "Получить Личностный портрет",
    ctaLabelEn: "Get Personality Portrait",
    featured: false,
    sortOrder: 3,
    legacyType: "report",
  },
  {
    productType: "bundle_all_topics",
    level: "bundle",
    slug: "bundle-three-topics",
    titleRu: "Bundle: 3 темы",
    titleEn: "Bundle: All 3 Topics",
    subtitleRu: "Деньги + Отношения + Личность",
    subtitleEn: "Money + Relationships + Personality",
    descriptionRu:
      "Три глубоких разбора по всем ключевым темам — выгоднее, чем покупать по отдельности.",
    descriptionEn:
      "Three deep readings across all key topics — better value than buying separately.",
    price: 79,
    priceLabelRu: "$79",
    priceLabelEn: "$79",
    visualPack: "cosmic_pastel",
    formatRu: "3 отдельных отчёта (MVP)",
    formatEn: "3 separate reports (MVP)",
    includesRu: ["Денежный код", "Код отношений", "Личностный портрет"],
    includesEn: ["Money Code", "Relationships Code", "Personality Portrait"],
    excludesRu: ["Полный натальный портрет", "Premium-разбор"],
    excludesEn: ["Full natal portrait", "Premium consultation"],
    ctaLabelRu: "Получить Bundle",
    ctaLabelEn: "Get Bundle",
    featured: true,
    sortOrder: 4,
    legacyType: "report",
  },
  {
    productType: "main_natal_portrait",
    level: "main",
    slug: "full-natal-portrait",
    titleRu: "Полный астрологический портрет",
    titleEn: "Full Astrological Portrait",
    subtitleRu: "40–50 страниц: личность, деньги, карьера, отношения, стратегия",
    subtitleEn: "40–50 pages: personality, money, career, relationships, strategy",
    descriptionRu:
      "Исчерпывающий натальный портрет — все сферы жизни, сценарии и стратегия развития.",
    descriptionEn:
      "Comprehensive natal portrait — all life areas, scenarios, and development strategy.",
    price: 149,
    priceLabelRu: "$149",
    priceLabelEn: "$149",
    visualPack: "dark_gold_mystic",
    formatRu: "Полный веб-разбор + PDF (скоро)",
    formatEn: "Full web report + PDF (coming soon)",
    includesRu: [
      "40–50 страниц",
      "Личность, деньги, карьера, отношения",
      "Сценарии и стратегия",
      "Все планеты и дома",
    ],
    includesEn: [
      "40–50 pages",
      "Personality, money, career, relationships",
      "Scenarios and strategy",
      "All planets and houses",
    ],
    excludesRu: [
      "Конкретный личный вопрос",
      "Живая консультация",
      "Точный прогноз событий",
      "Транзиты (если backend не поддерживает)",
    ],
    excludesEn: [
      "Specific personal question",
      "Live consultation",
      "Exact event prediction",
      "Transits (unless backend supports)",
    ],
    ctaLabelRu: "Получить полный портрет",
    ctaLabelEn: "Get Full Portrait",
    featured: true,
    sortOrder: 5,
    legacyType: "natal",
  },
  {
    productType: "premium_consultation",
    level: "premium",
    slug: "premium-consultation",
    titleRu: "Premium-разбор",
    titleEn: "Premium Consultation",
    subtitleRu: "Личный вопрос + эксперт + транзиты",
    subtitleEn: "Personal question + expert + transits",
    descriptionRu:
      "Индивидуальный разбор с живым астрологом: ваш вопрос, транзиты и персональные рекомендации.",
    descriptionEn:
      "Individual reading with a live astrologer: your question, transits, and personal recommendations.",
    price: 0,
    priceLabelRu: "По запросу",
    priceLabelEn: "On request",
    visualPack: "dark_gold_mystic",
    formatRu: "Заявка + консультация (скоро)",
    formatEn: "Application + consultation (coming soon)",
    includesRu: [
      "Личный запрос",
      "Ручная обработка",
      "Приоритетная проверка",
      "Учёт контекста",
      "Статус заявки в кабинете",
    ],
    includesEn: [
      "Personal request",
      "Manual processing",
      "Priority review",
      "Context considered",
      "Request status in account",
    ],
    excludesRu: [
      "Автоматический календарь",
      "Автоматический подбор эксперта",
      "Автоматическое планирование звонка",
      "Гарантированная мгновенная доставка",
    ],
    excludesEn: [
      "Automated calendar",
      "Automated expert matching",
      "Automatic call scheduling",
      "Guaranteed instant delivery",
    ],
    ctaLabelRu: "Оставить заявку",
    ctaLabelEn: "Submit Request",
    featured: false,
    sortOrder: 6,
    legacyType: "consultation",
  },
];

export function getLowTicketProductForTopic(topic: FunnelTopic): RealProductType {
  const map: Record<FunnelTopic, RealProductType> = {
    money: "low_ticket_money",
    relationships: "low_ticket_relationships",
    personality: "low_ticket_personality",
  };
  return map[topic];
}

export function getCatalogDef(productType: RealProductType): CatalogProductDef {
  const def = REAL_PRODUCT_CATALOG.find((p) => p.productType === productType);
  if (!def) throw new Error(`Unknown product type: ${productType}`);
  return def;
}

export function getProductByType(
  products: ProductConfig[],
  productType: RealProductType
): ProductConfig | undefined {
  return products.find((p) => p.productType === productType);
}

export function createRealProductLine(
  tenantSlug: string,
  locale: "en" | "ru" = "ru",
  activeTypes?: RealProductType[]
): ProductConfig[] {
  const catalog = activeTypes
    ? REAL_PRODUCT_CATALOG.filter((def) => activeTypes.includes(def.productType))
    : REAL_PRODUCT_CATALOG;

  return catalog.map((def) => {
    const isRu = locale === "ru";
    const extras = CATALOG_CONTENT_EXTRAS[def.productType];
    return {
      id: `${tenantSlug}-${def.slug}`,
      slug: def.slug,
      type: def.legacyType,
      productType: def.productType,
      level: def.level,
      theme: def.theme,
      title: isRu ? def.titleRu : def.titleEn,
      subtitle: isRu ? def.subtitleRu : def.subtitleEn,
      description: isRu ? def.descriptionRu : def.descriptionEn,
      shortDescription: isRu ? extras.shortDescriptionRu : extras.shortDescriptionEn,
      longDescription: isRu ? extras.longDescriptionRu : extras.longDescriptionEn,
      whatUserWillUnderstand: isRu
        ? extras.whatUserWillUnderstandRu
        : extras.whatUserWillUnderstandEn,
      reportOutline: isRu ? extras.reportOutlineRu : extras.reportOutlineEn,
      recommendedFor: isRu ? extras.recommendedForRu : extras.recommendedForEn,
      notFor: isRu ? extras.notForRu : extras.notForEn,
      estimatedPages: isRu ? extras.estimatedPagesRu : extras.estimatedPagesEn,
      primaryCTA: isRu ? extras.primaryCTARu : extras.primaryCTAEn,
      faq: isRu ? extras.faqRu : extras.faqEn,
      disclaimer: isRu ? extras.disclaimerRu : extras.disclaimerEn,
      price: def.price,
      priceLabel: isRu ? def.priceLabelRu : def.priceLabelEn,
      visualPack: def.visualPack,
      format: isRu ? def.formatRu : def.formatEn,
      includes: isRu ? def.includesRu : def.includesEn,
      excludes: isRu ? def.excludesRu : def.excludesEn,
      ctaLabel: isRu ? def.ctaLabelRu : def.ctaLabelEn,
      ctaAction: def.level === "premium" ? "request" : "coming-soon",
      featured: def.featured,
      sortOrder: def.sortOrder,
      status: "active" as const,
    };
  });
}

/** Toggle catalog products on/off while preserving catalog metadata. */
export function syncCatalogProducts(
  tenantSlug: string,
  locale: "en" | "ru",
  enabledTypes: RealProductType[]
): ProductConfig[] {
  const line = createRealProductLine(tenantSlug, locale);
  return line.map((product) => ({
    ...product,
    status: enabledTypes.includes(product.productType) ? "active" : "hidden",
  }));
}

export function createPilotReportLibrary(
  tenantSlug: string,
  locale: "en" | "ru" = "ru"
): import("./types").ReportLibraryItem[] {
  const products = createRealProductLine(tenantSlug, locale);
  return products
    .filter((p) => p.productType !== "premium_consultation")
    .map((product) => ({
      id: `${tenantSlug}-lib-${product.productType}`,
      productType: product.productType,
      productId: product.id,
      title: product.title,
      status: product.productType === "free_report" ? ("locked" as const) : ("locked" as const),
      theme: product.theme,
      updatedAt: new Date().toISOString(),
    }));
}

export function createMockReportLibrary(
  tenantSlug: string,
  locale: "en" | "ru" = "ru"
): import("./types").ReportLibraryItem[] {
  return createPilotReportLibrary(tenantSlug, locale);
}

/** Demo-only library with varied statuses for UI testing when explicitly enabled. */
export function createDemoReportLibrary(
  tenantSlug: string,
  locale: "en" | "ru" = "ru"
): import("./types").ReportLibraryItem[] {
  const products = createRealProductLine(tenantSlug, locale);
  const isRu = locale === "ru";
  const freeProduct = products.find((p) => p.productType === "free_report")!;
  const lowTickets = products.filter((p) => p.level === "low_ticket");
  const bundle = products.find((p) => p.productType === "bundle_all_topics")!;
  const main = products.find((p) => p.productType === "main_natal_portrait")!;

  const rel = lowTickets.find((p) => p.productType === "low_ticket_relationships")!;
  const pers = lowTickets.find((p) => p.productType === "low_ticket_personality")!;
  const money = lowTickets.find((p) => p.productType === "low_ticket_money")!;

  return [
    {
      id: `${tenantSlug}-lib-free`,
      productType: "free_report",
      productId: freeProduct.id,
      title: freeProduct.title,
      status: "locked",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${tenantSlug}-lib-rel-ready`,
      productType: "low_ticket_relationships",
      productId: rel.id,
      title: rel.title,
      status: "ready",
      theme: "relationships",
      reportId: "rpt_mock_rel_ready",
      pdfUrl: "https://cdn.example.com/pilot/reports/rpt_mock_rel_ready.pdf",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${tenantSlug}-lib-pers-gen`,
      productType: "low_ticket_personality",
      productId: pers.id,
      title: pers.title,
      status: "paid_generating",
      theme: "personality",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${tenantSlug}-lib-money-locked`,
      productType: "low_ticket_money",
      productId: money.id,
      title: money.title,
      status: "locked",
      theme: "money",
    },
    {
      id: `${tenantSlug}-lib-money-pending`,
      productType: "low_ticket_money",
      productId: money.id,
      title: isRu ? "Денежный код (ожидает оплаты)" : "Money Code (payment pending)",
      status: "pending_payment",
      theme: "money",
      updatedAt: new Date().toISOString(),
    },
    {
      id: `${tenantSlug}-lib-bundle`,
      productType: "bundle_all_topics",
      productId: bundle.id,
      title: bundle.title,
      status: "locked",
    },
    {
      id: `${tenantSlug}-lib-main`,
      productType: "main_natal_portrait",
      productId: main.id,
      title: main.title,
      status: "locked",
    },
    {
      id: `${tenantSlug}-lib-failed`,
      productType: "low_ticket_money",
      productId: money.id,
      title: isRu ? "Денежный код (ошибка)" : "Money Code (failed)",
      status: "failed",
      theme: "money",
    },
    {
      id: `${tenantSlug}-lib-revoked`,
      productType: "low_ticket_relationships",
      productId: rel.id,
      title: isRu ? "Код отношений (доступ отозван)" : "Relationships (revoked)",
      status: "revoked",
      theme: "relationships",
      reportId: "rpt_mock_revoked",
      updatedAt: new Date().toISOString(),
    },
  ];
}
