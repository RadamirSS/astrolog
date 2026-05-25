import type {
  AppLocaleCode,
  BirthProfile,
  BirthTimeAccuracy,
  FunnelTopic,
  ProductConfig,
  ReportSectionV2,
  ReportV2,
} from "./types";
import {
  getCatalogDef,
  getLowTicketProductForTopic,
  getProductByType,
} from "./product-catalog";

function sunSignFromDate(birthDate: string): string {
  const [, monthStr, dayStr] = birthDate.split("-");
  const month = Number(monthStr);
  const day = Number(dayStr);
  const signs = [
    { sign: "Capricorn", ru: "Козерог", end: [1, 19] },
    { sign: "Aquarius", ru: "Водолей", end: [2, 18] },
    { sign: "Pisces", ru: "Рыбы", end: [3, 20] },
    { sign: "Aries", ru: "Овен", end: [4, 19] },
    { sign: "Taurus", ru: "Телец", end: [5, 20] },
    { sign: "Gemini", ru: "Близнецы", end: [6, 20] },
    { sign: "Cancer", ru: "Рак", end: [7, 22] },
    { sign: "Leo", ru: "Лев", end: [8, 22] },
    { sign: "Virgo", ru: "Дева", end: [9, 22] },
    { sign: "Libra", ru: "Весы", end: [10, 22] },
    { sign: "Scorpio", ru: "Скорпион", end: [11, 21] },
    { sign: "Sagittarius", ru: "Стрелец", end: [12, 21] },
    { sign: "Capricorn", ru: "Козерог", end: [12, 31] },
  ];
  for (const s of signs) {
    const endMonth = s.end[0]!;
    const endDay = s.end[1]!;
    if (month === endMonth && day <= endDay) return s.sign;
    if (month < endMonth) {
      const idx = signs.indexOf(s);
      const prev = signs[(idx - 1 + signs.length) % signs.length]!;
      return prev.sign;
    }
  }
  return "Capricorn";
}

function sunSignRu(sign: string): string {
  const map: Record<string, string> = {
    Capricorn: "Козерог",
    Aquarius: "Водолей",
    Pisces: "Рыбы",
    Aries: "Овен",
    Taurus: "Телец",
    Gemini: "Близнецы",
    Cancer: "Рак",
    Leo: "Лев",
    Virgo: "Дева",
    Libra: "Весы",
    Scorpio: "Скорпион",
    Sagittarius: "Стрелец",
  };
  return map[sign] ?? sign;
}

const MOON_SIGNS = ["Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"];
const ASC_SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo"];

function pseudoMoonSign(birthDate: string): string {
  const day = Number(birthDate.split("-")[2] ?? 1);
  return MOON_SIGNS[day % MOON_SIGNS.length]!;
}

function pseudoAscSign(birthDate: string, birthTime?: string | null): string {
  if (!birthTime) return ASC_SIGNS[0]!;
  const hour = Number(birthTime.split(":")[0] ?? 12);
  return ASC_SIGNS[hour % ASC_SIGNS.length]!;
}

export interface BuildMockFreeReportV2Options {
  tenantId: string;
  birthProfile: Pick<
    BirthProfile,
    "name" | "birthDate" | "birthTime" | "timeAccuracy" | "topic"
  >;
  theme?: FunnelTopic;
  locale?: AppLocaleCode;
  products?: ProductConfig[];
}

export function buildMockFreeReportV2(options: BuildMockFreeReportV2Options): ReportV2 {
  const { tenantId, birthProfile, locale = "ru", products = [] } = options;
  const theme = options.theme ?? birthProfile.topic ?? "personality";
  const isRu = locale === "ru";
  const name = birthProfile.name;
  const sun = sunSignFromDate(birthProfile.birthDate);
  const sunRu = sunSignRu(sun);
  const moon = pseudoMoonSign(birthProfile.birthDate);
  const moonRu = sunSignRu(moon);
  const hasExactTime =
    birthProfile.timeAccuracy === "exact" || birthProfile.timeAccuracy === "approximate";
  const ascKnown = hasExactTime && Boolean(birthProfile.birthTime);
  const asc = ascKnown ? pseudoAscSign(birthProfile.birthDate, birthProfile.birthTime) : null;
  const ascRu = asc ? sunSignRu(asc) : null;

  const lowTicketType = getLowTicketProductForTopic(theme);
  const lowTicketProduct = getProductByType(products, lowTicketType);
  const lowTicketDef = getCatalogDef(lowTicketType);
  const freeDef = getCatalogDef("free_report");

  const topicLabels: Record<FunnelTopic, { en: string; ru: string }> = {
    money: { en: "money", ru: "деньги" },
    relationships: { en: "relationships", ru: "отношения" },
    personality: { en: "personality", ru: "личность" },
  };

  const sections: ReportSectionV2[] = [
    {
      id: "hero",
      type: "hero",
      title: isRu ? "Ваш мини-разбор готов" : "Your mini reading is ready",
      content: isRu
        ? `${name}, мы подготовили первый взгляд на вашу натальную карту.`
        : `${name}, here is your first look at your natal chart.`,
      order: 0,
    },
    {
      id: "sun",
      type: "planet_card",
      title: isRu ? "Солнце — кто вы по сути" : "Sun — who you are at core",
      content: isRu
        ? `Солнце в ${sunRu} раскрывает вашу суть, волю и то, как вы проявляете себя в мире.`
        : `Sun in ${sun} reveals your core essence, will, and how you show up in the world.`,
      order: 1,
      planet: "sun",
      icon: "☀️",
    },
    {
      id: "moon",
      type: "planet_card",
      title: isRu ? "Луна — что вам нужно внутри" : "Moon — what you need inside",
      content: isRu
        ? `Луна в ${moonRu} показывает эмоциональные потребности и то, что даёт вам чувство безопасности.`
        : `Moon in ${moon} shows your emotional needs and what gives you a sense of safety.`,
      order: 2,
      planet: "moon",
      icon: "🌙",
    },
    {
      id: "ascendant",
      type: "planet_card",
      title: isRu ? "Асцендент — как вы проявляетесь" : "Ascendant — how you appear",
      content: ascKnown
        ? isRu
          ? `Асцендент в ${ascRu} — это ваш «социальный фильтр»: как вас видят другие при первой встрече.`
          : `Ascendant in ${asc} is your social filter — how others see you at first meeting.`
        : isRu
          ? "Без точного времени рождения Асцендент и дома определить нельзя. Разбор по Солнцу и Луне остаётся точным, но восходящий знак будет уточнён позже."
          : "Without an exact birth time, Ascendant and houses cannot be determined. Sun and Moon readings remain useful, but your rising sign will be refined later.",
      order: 3,
      planet: "ascendant",
      icon: "⬆️",
      uncertain: !ascKnown,
    },
    {
      id: "inner-contrast",
      type: "insight",
      title: isRu ? "Главный внутренний контраст" : "Main inner contrast",
      content: isRu
        ? `Сочетание ${sunRu} и ${moonRu} создаёт внутренний диалог между тем, кем вы хотите быть, и тем, что вам нужно эмоционально.`
        : `The blend of ${sun} and ${moon} creates an inner dialogue between who you want to be and what you need emotionally.`,
      order: 4,
    },
    {
      id: "resource",
      type: "insight",
      title: isRu ? "Ваш ресурс" : "Your resource",
      content: isRu
        ? `В теме «${topicLabels[theme].ru}» ваш ключевой ресурс — способность ${theme === "money" ? "видеть возможности там, где другие видят риск" : theme === "relationships" ? "создавать глубокую эмоциональную связь" : "оставаться верным своей природе"}.`
        : `In the theme of ${topicLabels[theme].en}, your key resource is the ability to ${theme === "money" ? "see opportunity where others see risk" : theme === "relationships" ? "create deep emotional connection" : "stay true to your nature"}.`,
      order: 5,
    },
    {
      id: "explore-deeper",
      type: "summary",
      title: isRu ? "Что изучить глубже" : "What to explore deeper",
      content: isRu
        ? `Мини-разбор — это первые 3 точки вашей карты. Для полного понимания темы «${topicLabels[theme].ru}» рекомендуем углублённый продукт.`
        : `This mini reading covers the first 3 chart points. For full understanding of ${topicLabels[theme].en}, we recommend the deep-dive product.`,
      order: 6,
    },
    {
      id: "cta",
      type: "cta",
      title: isRu ? lowTicketDef.titleRu : lowTicketDef.titleEn,
      content: isRu ? lowTicketDef.descriptionRu : lowTicketDef.descriptionEn,
      order: 7,
      productId: lowTicketProduct?.id,
    },
  ];

  if (!ascKnown) {
    sections.push({
      id: "disclaimer-time",
      type: "disclaimer",
      title: isRu ? "Точность разбора" : "Reading accuracy",
      content: isRu
        ? "При неизвестном времени рождения Асцендент не рассчитывается. Укажите время позже для более точного разбора."
        : "With unknown birth time, Ascendant is not calculated. Add your birth time later for a more precise reading.",
      order: 8,
      uncertain: true,
    });
  }

  const now = new Date().toISOString();

  return {
    schemaVersion: 2,
    id: `${tenantId}-free-report-${Date.now()}`,
    productType: "free_report",
    level: "free",
    theme,
    title: isRu ? freeDef.titleRu : freeDef.titleEn,
    subtitle: isRu
      ? `Мини-разбор для ${name}`
      : `Mini reading for ${name}`,
    visualPack: freeDef.visualPack,
    status: "ready",
    sections,
    actions: [
      {
        id: "cta-low-ticket",
        type: "open_product",
        label: isRu ? lowTicketDef.ctaLabelRu : lowTicketDef.ctaLabelEn,
        productId: lowTicketProduct?.id,
        productType: lowTicketType,
      },
      {
        id: "cta-paywall",
        type: "open_paywall",
        label: isRu ? "Сравнить все продукты" : "Compare all products",
      },
    ],
    pdfUrl: "https://cdn.example.com/pilot/reports/mock-v2.pdf",
    createdAt: now,
    updatedAt: now,
  };
}

export function isAscendantUncertain(timeAccuracy: BirthTimeAccuracy): boolean {
  return timeAccuracy === "unknown";
}

export interface BuildMockLibraryPaidReportV2Options {
  reportId: string;
  productType: import("./types").RealProductType;
  theme?: FunnelTopic;
  locale?: AppLocaleCode;
  status?: ReportV2["status"];
  pdfUrl?: string | null;
}

/** Static paid report payloads for pilot library seeds (no real calculations). */
export function buildMockLibraryPaidReportV2(
  options: BuildMockLibraryPaidReportV2Options
): ReportV2 {
  const { reportId, productType, locale = "ru" } = options;
  const theme = options.theme ?? "relationships";
  const isRu = locale === "ru";
  const def = getCatalogDef(productType);
  const now = new Date().toISOString();
  const bundleProduct = getProductByType([], "bundle_all_topics");
  const mainProduct = getProductByType([], "main_natal_portrait");

  const sections: ReportSectionV2[] = [
    {
      id: "hero",
      type: "hero",
      title: isRu ? "Ваш разбор готов" : "Your reading is ready",
      content: isRu
        ? `Полный разбор «${def.titleRu}» подготовлен. Это персональный материал для самопознания, не финансовый или медицинский совет.`
        : `Your full ${def.titleEn} reading is ready. This is for self-reflection, not financial or medical advice.`,
      order: 0,
    },
    {
      id: "planet-focus",
      type: "planet_card",
      title: isRu ? "Ключевая планета темы" : "Key planet for this theme",
      content: isRu
        ? "Планетарные акценты показывают, где в карте сосредоточена энергия выбранной темы."
        : "Planetary emphasis shows where chart energy focuses for this theme.",
      order: 1,
      planet: "moon",
      icon: "♀",
    },
    {
      id: "insight-main",
      type: "insight",
      title: isRu ? "Главный инсайт" : "Main insight",
      content: isRu
        ? "Сильные стороны и зоны роста описаны через натальные показатели — без фаталистических выводов."
        : "Strengths and growth areas are described through natal indicators — without fatalistic conclusions.",
      order: 2,
    },
    {
      id: "summary",
      type: "summary",
      title: isRu ? "Краткое резюме" : "Summary",
      content: isRu
        ? "Используйте разбор как карту для размышлений и осознанных решений."
        : "Use this reading as a map for reflection and conscious choices.",
      order: 3,
    },
    {
      id: "locked-preview",
      type: "locked_preview",
      title: isRu ? "Полный астрологический портрет" : "Full astrological portrait",
      content: isRu
        ? "Углублённый портрет раскрывает все дома и аспекты — доступен как отдельный продукт."
        : "The deep portrait covers all houses and aspects — available as a separate product.",
      order: 4,
      productId: mainProduct?.id,
    },
    {
      id: "cta-bundle",
      type: "cta",
      title: isRu ? "Bundle: 3 темы" : "Bundle: All 3 Topics",
      content: isRu
        ? "Объедините денежный, отношенческий и личностный разбор в одном пакете."
        : "Combine money, relationships, and personality readings in one bundle.",
      order: 5,
      productId: bundleProduct?.id,
    },
    {
      id: "disclaimer",
      type: "disclaimer",
      title: isRu ? "Важно" : "Important",
      content: isRu
        ? "Разбор носит информационный характер. Решения о здоровье, финансах и праве принимайте с профильными специалистами."
        : "This reading is informational. Consult qualified professionals for health, finance, and legal decisions.",
      order: 6,
    },
  ];

  return {
    schemaVersion: 2,
    id: reportId,
    productType,
    level: def.level,
    theme,
    title: isRu ? def.titleRu : def.titleEn,
    subtitle: isRu ? def.subtitleRu : def.subtitleEn,
    visualPack: def.visualPack,
    status: options.status ?? "ready",
    sections,
    actions: [
      {
        id: "download-pdf",
        type: "download_pdf",
        label: isRu ? "Скачать PDF" : "Download PDF",
      },
      {
        id: "request-premium",
        type: "request_premium",
        label: isRu ? "Запросить Premium-разбор" : "Request Premium consultation",
      },
    ],
    pdfUrl: options.pdfUrl ?? "https://cdn.example.com/pilot/reports/mock-paid.pdf",
    createdAt: now,
    updatedAt: now,
  };
}
