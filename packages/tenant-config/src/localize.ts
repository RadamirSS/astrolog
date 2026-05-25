import type {
  AppLocaleCode,
  BirthProfileTopic,
  FunnelTopic,
  ProductCtaAction,
  ProductType,
  TenantConfig,
} from "./types";
import {
  BIRTH_PROFILE_TOPIC_LABELS,
  FUNNEL_TOPIC_LABELS,
  PRODUCT_CTA_ACTION_LABELS,
  PRODUCT_TYPE_LABELS,
} from "./types";

function mergeWhatYouReceive(
  base: TenantConfig["content"]["home"]["whatYouReceive"],
  overrides: TenantConfig["content"]["home"]["whatYouReceive"]
) {
  if (!overrides?.length) return base;
  if (!base?.length) return overrides;
  return base.map((item) => {
    const patch = overrides.find((o) => o.id === item.id);
    return patch ? { ...item, ...patch } : item;
  });
}

function mergeFaqItems(
  base: TenantConfig["content"]["home"]["faqItems"],
  overrides: TenantConfig["content"]["home"]["faqItems"]
) {
  if (!overrides?.length) return base;
  if (!base?.length) return overrides;
  return base.map((item, index) => ({
    ...item,
    ...(overrides[index] ?? {}),
  }));
}

export function localizeTenantConfig(
  config: TenantConfig,
  locale: AppLocaleCode
): TenantConfig {
  if (locale === "en" || !config.locales?.ru) {
    return structuredClone(config);
  }

  const overrides = config.locales.ru;
  const result = structuredClone(config);

  if (overrides.brand) {
    result.brand = { ...result.brand, ...overrides.brand };
  }

  if (overrides.content) {
    const contentOverride = overrides.content;
    result.content = {
      ...result.content,
      reportIntro: contentOverride.reportIntro ?? result.content.reportIntro,
      productsIntro: contentOverride.productsIntro ?? result.content.productsIntro,
      home: {
        ...result.content.home,
        ...contentOverride.home,
        whatYouReceive: mergeWhatYouReceive(
          result.content.home.whatYouReceive,
          contentOverride.home?.whatYouReceive
        ),
        faqItems: mergeFaqItems(
          result.content.home.faqItems,
          contentOverride.home?.faqItems
        ),
        consultationCta: contentOverride.home?.consultationCta
          ? { ...result.content.home.consultationCta, ...contentOverride.home.consultationCta }
          : result.content.home.consultationCta,
      },
      onboarding: {
        ...result.content.onboarding,
        ...contentOverride.onboarding,
      },
      paywall: contentOverride.paywall
        ? { ...result.content.paywall, ...contentOverride.paywall }
        : result.content.paywall,
      profileLabels: contentOverride.profileLabels
        ? { ...result.content.profileLabels, ...contentOverride.profileLabels }
        : result.content.profileLabels,
      loadingMessages: contentOverride.loadingMessages ?? result.content.loadingMessages,
    };
  }

  if (overrides.products) {
    result.products = result.products.map((product) => {
      const patch = overrides.products?.[product.id];
      return patch ? { ...product, ...patch } : product;
    });
  }

  return result;
}

const RU_PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  consultation: "Консультация",
  report: "Разбор",
  course: "Курс",
  natal: "Натальная карта",
  compatibility: "Совместимость",
  forecast: "Прогноз",
  custom: "Индивидуальная услуга",
};

const RU_PRODUCT_CTA_ACTION_LABELS: Record<ProductCtaAction, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  external: "Внешняя ссылка",
  request: "Запросить информацию",
  "coming-soon": "Скоро",
};

const RU_BIRTH_PROFILE_TOPIC_LABELS: Record<BirthProfileTopic, string> = {
  money: "Деньги",
  relationships: "Отношения",
  personality: "Личность",
};

const RU_FUNNEL_TOPIC_LABELS: Record<FunnelTopic, string> = {
  money: "Деньги",
  relationships: "Отношения",
  personality: "Личность",
};

export function getLocalizedLabelMaps(locale: AppLocaleCode) {
  if (locale === "ru") {
    return {
      productTypeLabels: RU_PRODUCT_TYPE_LABELS,
      productCtaActionLabels: RU_PRODUCT_CTA_ACTION_LABELS,
      birthProfileTopicLabels: RU_BIRTH_PROFILE_TOPIC_LABELS,
      funnelTopicLabels: RU_FUNNEL_TOPIC_LABELS,
    };
  }
  return {
    productTypeLabels: PRODUCT_TYPE_LABELS,
    productCtaActionLabels: PRODUCT_CTA_ACTION_LABELS,
    birthProfileTopicLabels: BIRTH_PROFILE_TOPIC_LABELS,
    funnelTopicLabels: FUNNEL_TOPIC_LABELS,
  };
}

export function getFunnelTopicLabel(topic: FunnelTopic, locale: AppLocaleCode): string {
  return getLocalizedLabelMaps(locale).funnelTopicLabels[topic];
}

export function getBirthProfileTopicLabel(
  topic: BirthProfileTopic,
  locale: AppLocaleCode
): string {
  return getLocalizedLabelMaps(locale).birthProfileTopicLabels[topic];
}
