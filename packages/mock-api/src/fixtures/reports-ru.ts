import type { Report } from "@astro/tenant-config";

const now = new Date().toISOString();

export const mockReportsRu: Record<string, Report> = {
  tenant_mystic: {
    id: "report_mystic_free",
    type: "natal",
    title: "Снимок вашей тени",
    subtitle: "Взгляд под поверхность",
    summary:
      "Ваша карта говорит об искателе, тянущемся к глубине и трансформации. Этот бесплатный разбор освещает паттерны вашего внутреннего мира.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Солнце", value: "Скорпион", icon: "sun" },
      { id: "h2", label: "Луна", value: "Рыбы", icon: "moon" },
      { id: "h3", label: "Асцендент", value: "Козерог", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Ядро личности",
        content:
          "Вы идёте по жизни через интуицию и интенсивность. Ваш дар — видеть то, что другие упускают; в тени скрыта ваша сила.",
        order: 0,
        variant: "highlight",
        access: "free",
      },
      {
        id: "s2",
        title: "Текущий цикл",
        content:
          "Открывается сезон отпускания. Доверяйте тихим моментам — они готовят вас к более аутентичному проявлению.",
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
    title: "Разбор вашего сердца",
    subtitle: "Нежный инсайт для выбранного пути",
    summary:
      "Ваш профиль рождения говорит о душе, которая ведёт через эмпатию. Этот обзор чтит вашу эмоциональную мудрость и природный дар заботы.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Солнце", value: "Телец", icon: "sun" },
      { id: "h2", label: "Луна", value: "Рак", icon: "moon" },
      { id: "h3", label: "Асцендент", value: "Весы", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Эмоциональный ландшафт",
        content:
          "Вы создаёте безопасность для других через тепло и присутствие. Не забывайте направлять ту же нежность внутрь.",
        order: 0,
        variant: "quote",
        access: "free",
      },
      {
        id: "s2",
        title: "Фокус запроса",
        content:
          "Выбранная вами тема просит мягкого внимания. Небольшие последовательные шаги дадут больше ясности, чем давление.",
        order: 1,
        access: "free",
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Код отношений",
        teaser: "Паттерны Венеры показывают, как вы даёте любовь — и что вам нужно получать...",
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
  tenant_luxury: {
    id: "report_luxury_free",
    type: "free",
    title: "Ваш executive-снимок",
    subtitle: "Приватный взгляд на небесную стратегию",
    summary:
      "Ваша карта раскрывает лидера, настроенного на точность и дальновидность. Этот complimentary snapshot подсвечивает паттерны следующего стратегического окна.",
    generatedAt: now,
    highlights: [
      { id: "h1", label: "Солнце", value: "Козерог", icon: "sun" },
      { id: "h2", label: "Луна", value: "Дева", icon: "moon" },
      { id: "h3", label: "Асцендент", value: "Лев", icon: "rising" },
    ],
    sections: [
      {
        id: "s1",
        title: "Лидерская подпись",
        content:
          "Вы ведёте через структуру и спокойный авторитет. Карта благоприятствует решениям, подкреплённым исследованием, таймингом и стратегическим терпением.",
        order: 0,
        variant: "highlight",
        access: "free",
      },
      {
        id: "s2",
        title: "Текущее окно",
        content:
          "Следующий квартал благоприятствует консолидации, а не расширению. Уточните работающее — карта вознаграждает дисциплинированный фокус.",
        order: 1,
        access: "free",
      },
    ],
    lockedSections: [
      {
        id: "l1",
        title: "Полный астрологический портрет",
        teaser: "Полный натальный портрет раскрывает все дома и аспекты — доступен как отдельный продукт...",
        unlockProductId: "luxury-gold-full-natal-portrait",
      },
    ],
    cta: {
      label: "К продуктам",
      title: "Следующий уровень",
      subtitle: "Полный портрет и Premium-разбор",
      buttonLabel: "К услугам",
      action: "navigate_products",
    },
    recommendedProducts: [
      "luxury-gold-premium-consultation",
      "luxury-gold-full-natal-portrait",
      "luxury-gold-bundle-three-topics",
    ],
  },
};
