import type { CreatorMiniAppConfig, MiniAppConfig, ProductConfig, TenantConfig, ThemePreset, VisualPack } from "./types";
import { createRealProductLine } from "./product-catalog";
import { ensureSurfaces } from "./surfaces";

export function createDefaultMiniApp(
  slug: string,
  visualPack: VisualPack = "cosmic_pastel"
): CreatorMiniAppConfig {
  const base: MiniAppConfig = {
    publicSlug: slug,
    visualPack,
    defaultTopic: null,
    publicStatus: "draft",
    introCopy: "",
    welcomeMessage: "",
    promoCtaCopy: "",
  };
  return ensureSurfaces(base, slug);
}

export function createDefaultProducts(tenantSlug: string): ProductConfig[] {
  return createRealProductLine(tenantSlug, "ru");
}

export function createDefaultTenantConfig(
  tenantId: string,
  slug: string,
  displayName: string,
  preset: ThemePreset = "cosmic-violet",
  miniAppOverrides?: Partial<NonNullable<TenantConfig["miniApp"]>>
): TenantConfig {
  const now = new Date().toISOString();
  return {
    tenantId,
    slug,
    status: "active",
    version: 1,
    brand: {
      displayName,
      tagline: "Персональная астрология для вашей жизни",
      supportEmail: `hello@${slug.replace(/-/g, "")}.demo.astrology.app`,
    },
    theme: {
      preset,
      overrides: {},
    },
    content: {
      home: {
        headline: "Узнайте себя через звёзды",
        subheadline:
          "Выберите тему, которая вас волнует — и получите бесплатный мини-разбор по вашей натальной карте.",
        ctaLabel: "Начать бесплатный разбор",
        whatYouReceive: [
          {
            id: "wr1",
            title: "Солнце, Луна, Асцендент",
            text: "Три ключевые точки вашей карты — бесплатно",
          },
          {
            id: "wr2",
            title: "Персональный инсайт",
            text: "Короткий разбор по выбранной теме",
          },
          {
            id: "wr3",
            title: "Путь к глубокому разбору",
            text: "CTA к продукту по вашей теме",
          },
        ],
        faqItems: [
          {
            question: "Нужно ли точное время рождения?",
            answer:
              "Для Солнца и Луны достаточно даты. Время рождения нужно для Асцендента и домов — без него разбор всё равно полезен, но менее точен.",
          },
          {
            question: "Это бесплатно?",
            answer: "Да, мини-разбор бесплатный. Углублённые продукты — платные.",
          },
        ],
      },
      onboarding: {
        welcomeText: "Расскажите о себе — это нужно для персонального разбора.",
        birthDateLabel: "Дата рождения",
        birthTimeLabel: "Время рождения",
        birthPlaceLabel: "Место рождения",
        topicLabel: "Выбранная тема",
        stepsIntro: "Данные рождения используются только для астрологического разбора.",
      },
      reportIntro: "Ваш персональный мини-разбор готов.",
      productsIntro: "Углубите понимание себя с помощью наших продуктов.",
      paywall: {
        title: "Выберите глубину разбора",
        subtitle: "Сравните бесплатный мини-разбор и платные продукты",
      },
      loadingMessages: [
        "Читаем звёзды для вас...",
        "Выстраиваем вашу космическую карту...",
        "Почти готово...",
      ],
      profileLabels: {
        name: "Имя",
        birthDate: "Дата рождения",
        birthPlace: "Место рождения",
      },
    },
    modules: {
      onboarding: true,
      freeReport: true,
      products: true,
      profile: true,
      payments: { enabled: false },
      telegram: { botConnected: false },
      analytics: { enabled: false },
    },
    products: createDefaultProducts(slug),
    miniApp: {
      ...createDefaultMiniApp(slug),
      ...miniAppOverrides,
    } as TenantConfig["miniApp"],
    meta: {
      createdAt: now,
      updatedAt: now,
    },
  };
}
