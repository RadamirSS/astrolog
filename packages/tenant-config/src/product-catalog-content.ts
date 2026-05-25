import type { RealProductType } from "./types";

export interface CatalogContentExtras {
  shortDescriptionRu: string;
  shortDescriptionEn: string;
  longDescriptionRu: string;
  longDescriptionEn: string;
  whatUserWillUnderstandRu: string[];
  whatUserWillUnderstandEn: string[];
  reportOutlineRu: string[];
  reportOutlineEn: string[];
  recommendedForRu: string[];
  recommendedForEn: string[];
  notForRu: string[];
  notForEn: string[];
  estimatedPagesRu: string;
  estimatedPagesEn: string;
  primaryCTARu: string;
  primaryCTAEn: string;
  faqRu: Array<{ question: string; answer: string }>;
  faqEn: Array<{ question: string; answer: string }>;
  disclaimerRu: string;
  disclaimerEn: string;
}

export const CATALOG_CONTENT_EXTRAS: Record<RealProductType, CatalogContentExtras> = {
  free_report: {
    shortDescriptionRu: "Короткий бесплатный разбор для первого знакомства с картой.",
    shortDescriptionEn: "A short free reading to introduce your chart.",
    longDescriptionRu:
      "Мини-разбор помогает увидеть себя через Солнце, Луну и Асцендент — без глубокого погружения, но с понятным направлением к платному продукту по выбранной теме.",
    longDescriptionEn:
      "The mini report introduces you through Sun, Moon, and Ascendant — not as deep as paid products, but enough to guide you toward the right next step.",
    whatUserWillUnderstandRu: [
      "Кто вы по сути (Солнце)",
      "Что вам нужно внутри (Луна)",
      "Как вы проявляетесь (Асцендент, если время известно)",
      "Главный внутренний контраст",
      "Ваш ресурс и зона для более глубокого разбора",
    ],
    whatUserWillUnderstandEn: [
      "Your core self (Sun)",
      "What you need inside (Moon)",
      "How you show up (Ascendant when birth time is known)",
      "Main inner contrast",
      "Your resource and what to explore deeper",
    ],
    reportOutlineRu: [
      "Обложка",
      "Данные рождения",
      "Солнце — кто вы по сути",
      "Луна — что вам нужно внутри",
      "Асцендент — как вы проявляетесь",
      "Главный внутренний контраст",
      "Ваш ресурс",
      "Что стоит разобрать глубже",
      "CTA на выбранный Low Ticket",
    ],
    reportOutlineEn: [
      "Cover",
      "Birth data",
      "Sun — who you are at core",
      "Moon — what you need inside",
      "Ascendant — how you show up",
      "Main inner contrast",
      "Your resource",
      "What to explore deeper",
      "CTA to selected low-ticket product",
    ],
    recommendedForRu: ["Новичков в астрологии", "Тех, кто хочет быстро понять карту", "Первый шаг перед покупкой"],
    recommendedForEn: ["Astrology beginners", "Quick chart overview seekers", "First step before a paid product"],
    notForRu: ["Тех, кому нужен глубокий PDF по теме", "Тех, кто ждёт полный портрет"],
    notForEn: ["Those needing a deep topic PDF", "Those expecting a full portrait"],
    estimatedPagesRu: "5–8 экранов",
    estimatedPagesEn: "5–8 screens",
    primaryCTARu: "Получить мини-разбор",
    primaryCTAEn: "Get Mini Report",
    faqRu: [
      {
        question: "Нужно ли точное время рождения?",
        answer: "Для Солнца и Луны достаточно даты. Без времени Асцендент и дома не рассчитываются точно — мы объясним это мягко.",
      },
      {
        question: "Это действительно бесплатно?",
        answer: "Да, мини-разбор бесплатный и не заменяет платные продукты.",
      },
    ],
    faqEn: [
      {
        question: "Do I need an exact birth time?",
        answer: "Date is enough for Sun and Moon. Without time, Ascendant and houses are not precise — we explain this gently.",
      },
      {
        question: "Is it really free?",
        answer: "Yes — the mini report is free and does not replace paid products.",
      },
    ],
    disclaimerRu:
      "Мини-разбор носит ознакомительный характер и не является медицинской, юридической или финансовой консультацией.",
    disclaimerEn:
      "The mini report is informational only and is not medical, legal, or financial advice.",
  },
  low_ticket_money: {
    shortDescriptionRu: "Глубокий разбор денежных паттернов и ресурсных сценариев.",
    shortDescriptionEn: "Deep reading of money patterns and resource scenarios.",
    longDescriptionRu:
      "Денежный код показывает архитектуру вашей карты в теме денег: личные ресурсы, каналы дохода, риски и зрелую стратегию.",
    longDescriptionEn:
      "Money Code reveals your chart's money architecture: personal resources, income channels, risks, and a mature strategy.",
    whatUserWillUnderstandRu: [
      "Как устроена денежная архитектура вашей карты",
      "Главные каналы дохода и зоны роста",
      "Повторяющиеся денежные сценарии",
      "Зону риска и зрелую денежную стратегию",
    ],
    whatUserWillUnderstandEn: [
      "How your chart's money architecture works",
      "Main income channels and growth zones",
      "Repeating money scenarios",
      "Risk zone and mature money strategy",
    ],
    reportOutlineRu: [
      "Денежная архитектура карты",
      "2 дом — личные деньги и самоценность",
      "Управитель 2 дома — главный канал дохода",
      "Венера — принятие оплаты и ощущение ценности",
      "Меркурий — денежное мышление, переговоры, договорённости",
      "Юпитер — рост, масштаб, возможности",
      "6 дом — работа, навык, регулярный доход",
      "10 дом / MC — профессия, статус, рост цены",
      "7 дом — клиенты, партнёры, рекомендации",
      "8 дом — чужие деньги, риски, долги, совместные ресурсы",
      "Сатурн — дисциплина, страх нехватки, зрелость",
      "Денежные сценарии",
      "Зона риска",
      "Зрелая денежная стратегия",
      "Главная денежная формула",
      "Итоговая таблица",
    ],
    reportOutlineEn: [
      "Money architecture of the chart",
      "2nd house — personal money and self-worth",
      "Ruler of 2nd house — main income channel",
      "Venus — receiving payment and sense of value",
      "Mercury — money mindset, negotiations, agreements",
      "Jupiter — growth, scale, opportunities",
      "6th house — work, skill, regular income",
      "10th house / MC — profession, status, pricing growth",
      "7th house — clients, partners, referrals",
      "8th house — other people's money, risks, debts, shared resources",
      "Saturn — discipline, scarcity fear, maturity",
      "Money scenarios",
      "Risk zone",
      "Mature money strategy",
      "Main money formula",
      "Summary table",
    ],
    recommendedForRu: [
      "Тех, кто хочет понять денежные паттерны",
      "Фрилансеров и предпринимателей",
      "Тех, кто застрял в финансовых сценариях",
    ],
    recommendedForEn: [
      "Those exploring money patterns",
      "Freelancers and entrepreneurs",
      "Those stuck in financial scenarios",
    ],
    notForRu: [
      "Тех, кто ждёт инвестиционные или налоговые советы",
      "Тех, кому нужен точный прогноз дохода",
    ],
    notForEn: [
      "Those expecting investment or tax advice",
      "Those needing exact income forecasts",
    ],
    estimatedPagesRu: "15–20 страниц",
    estimatedPagesEn: "15–20 pages",
    primaryCTARu: "Получить Денежный код",
    primaryCTAEn: "Get Money Code",
    faqRu: [
      {
        question: "Это финансовая консультация?",
        answer: "Нет. Это астрологический разбор паттернов, а не инвестиционный или налоговый совет.",
      },
      {
        question: "Гарантирует ли разбор рост дохода?",
        answer: "Нет. Мы показываем сценарии и стратегию, но не обещаем конкретный финансовый результат.",
      },
    ],
    faqEn: [
      {
        question: "Is this financial advice?",
        answer: "No. It is an astrological reading of patterns, not investment or tax advice.",
      },
      {
        question: "Does it guarantee income growth?",
        answer: "No. We show scenarios and strategy, not guaranteed financial outcomes.",
      },
    ],
    disclaimerRu:
      "Разбор не является инвестиционным, юридическим или налоговым советом и не гарантирует доход.",
    disclaimerEn:
      "This reading is not investment, legal, or tax advice and does not guarantee income.",
  },
  low_ticket_relationships: {
    shortDescriptionRu: "Разбор отношенческих сценариев, близости и повторяющихся паттернов.",
    shortDescriptionEn: "Reading of relationship scenarios, closeness, and repeating patterns.",
    longDescriptionRu:
      "Код отношений помогает понять, как вы любите, что ищете в партнёрстве и что мешает или укрепляет близость.",
    longDescriptionEn:
      "Relationships Code helps you understand how you love, what you seek in partnership, and what blocks or strengthens closeness.",
    whatUserWillUnderstandRu: [
      "Главный сценарий отношений",
      "Как вы выбираете и проявляете любовь",
      "Эмоциональные потребности и границы",
      "Что разрушает и что делает отношения зрелыми",
    ],
    whatUserWillUnderstandEn: [
      "Main relationship scenario",
      "How you choose and express love",
      "Emotional needs and boundaries",
      "What destroys and what matures relationships",
    ],
    reportOutlineRu: [
      "Главный сценарий отношений",
      "Венера — как человек любит и выбирает",
      "Марс — желание, инициатива, страсть, злость",
      "Луна — эмоциональная безопасность",
      "7 дом — партнёрство и образ другого",
      "Управитель 7 дома — через что строятся отношения",
      "5 дом — романтика, влюблённость, удовольствие",
      "8 дом — интимность, доверие, ревность, контроль",
      "Сатурн — дистанция, надёжность, зрелость",
      "Лилит / Хирон — острые точки",
      "Повторяющиеся сценарии",
      "Что разрушает близость",
      "Что делает отношения зрелыми",
      "Главная формула отношений",
    ],
    reportOutlineEn: [
      "Main relationship scenario",
      "Venus — how you love and choose",
      "Mars — desire, initiative, passion, anger",
      "Moon — emotional safety",
      "7th house — partnership and image of the other",
      "Ruler of 7th house — how relationships are built",
      "5th house — romance, infatuation, pleasure",
      "8th house — intimacy, trust, jealousy, control",
      "Saturn — distance, reliability, maturity",
      "Lilith / Chiron — sharp points",
      "Repeating scenarios",
      "What destroys closeness",
      "What makes relationships mature",
      "Main relationship formula",
    ],
    recommendedForRu: [
      "Тех, кто хочет понять свои паттерны в любви",
      "Тех, кто повторяет одни и те же сценарии",
      "Тех, кто готов работать над близостью",
    ],
    recommendedForEn: [
      "Those exploring love patterns",
      "Those repeating the same scenarios",
      "Those ready to work on closeness",
    ],
    notForRu: [
      "Синастрии с конкретным человеком",
      "Прогноза даты свадьбы",
      "Психотерапии или медицинских советов",
    ],
    notForEn: [
      "Synastry with a specific person",
      "Marriage date prediction",
      "Psychotherapy or medical advice",
    ],
    estimatedPagesRu: "15–20 страниц",
    estimatedPagesEn: "15–20 pages",
    primaryCTARu: "Получить Код отношений",
    primaryCTAEn: "Get Relationships Code",
    faqRu: [
      {
        question: "Можно ли узнать совместимость с партнёром?",
        answer: "Нет, этот продукт про ваши личные отношенческие паттерны, а не синастрию.",
      },
      {
        question: "Обещает ли разбор идеальные отношения?",
        answer: "Нет. Мы показываем сценарии и точки роста, без гарантии конкретного исхода.",
      },
    ],
    faqEn: [
      {
        question: "Can I check compatibility with my partner?",
        answer: "No — this product is about your personal patterns, not synastry.",
      },
      {
        question: "Does it promise perfect relationships?",
        answer: "No — we show scenarios and growth points without guaranteed outcomes.",
      },
    ],
    disclaimerRu:
      "Разбор не заменяет психотерапию, медицинскую помощь и не предсказывает конкретный исход отношений.",
    disclaimerEn:
      "This reading does not replace therapy or medical care and does not predict a specific relationship outcome.",
  },
  low_ticket_personality: {
    shortDescriptionRu: "Глубокий портрет личности, сильных сторон и зоны роста.",
    shortDescriptionEn: "Deep portrait of personality, strengths, and growth zone.",
    longDescriptionRu:
      "Личностный портрет раскрывает ядро вашей личности через ключевые точки карты, стихии и узлы.",
    longDescriptionEn:
      "Personality Portrait reveals your core self through key chart points, elements, and nodes.",
    whatUserWillUnderstandRu: [
      "Ядро личности и главную формулу",
      "Сильные стороны и зону роста",
      "Внутренний конфликт и ресурс",
      "Направление развития",
    ],
    whatUserWillUnderstandEn: [
      "Personality core and main formula",
      "Strengths and growth zone",
      "Inner conflict and resource",
      "Direction for development",
    ],
    reportOutlineRu: [
      "Ядро личности",
      "Солнце",
      "Луна",
      "Асцендент",
      "Управитель Асцендента",
      "Меркурий",
      "Венера",
      "Марс",
      "Сатурн",
      "Стихии",
      "Северный и Южный узел",
      "Сильные стороны",
      "Зона роста",
      "Внутренний конфликт",
      "Главная формула личности",
    ],
    reportOutlineEn: [
      "Personality core",
      "Sun",
      "Moon",
      "Ascendant",
      "Ascendant ruler",
      "Mercury",
      "Venus",
      "Mars",
      "Saturn",
      "Elements",
      "North and South Node",
      "Strengths",
      "Growth zone",
      "Inner conflict",
      "Main personality formula",
    ],
    recommendedForRu: [
      "Тех, кто хочет лучше понять себя",
      "Тех, кто ищет направление развития",
      "Тех, кто готов работать с внутренними противоречиями",
    ],
    recommendedForEn: [
      "Those seeking self-understanding",
      "Those looking for a development direction",
      "Those ready to work with inner contrasts",
    ],
    notForRu: [
      "Медицинской или психологической диагностики",
      "Гарантии судьбы или точных событий",
    ],
    notForEn: [
      "Medical or psychological diagnosis",
      "Fate guarantees or exact event prediction",
    ],
    estimatedPagesRu: "15–20 страниц",
    estimatedPagesEn: "15–20 pages",
    primaryCTARu: "Получить Личностный портрет",
    primaryCTAEn: "Get Personality Portrait",
    faqRu: [
      {
        question: "Это психологический диагноз?",
        answer: "Нет. Это астрологический портрет, а не медицинская или психологическая диагностика.",
      },
    ],
    faqEn: [
      {
        question: "Is this a psychological diagnosis?",
        answer: "No. It is an astrological portrait, not medical or psychological diagnosis.",
      },
    ],
    disclaimerRu:
      "Разбор носит информационный характер и не является медицинской или психологической диагностикой.",
    disclaimerEn:
      "This reading is informational and is not medical or psychological diagnosis.",
  },
  bundle_all_topics: {
    shortDescriptionRu: "Три отдельных разбора: деньги, отношения и личность.",
    shortDescriptionEn: "Three separate readings: money, relationships, and personality.",
    longDescriptionRu:
      "Bundle включает три отдельных отчёта — Денежный код, Код отношений и Личностный портрет. Это не один объединённый сложный отчёт, а три полноценных разбора по темам.",
    longDescriptionEn:
      "The bundle includes three separate reports — Money Code, Relationships Code, and Personality Portrait. This is not one combined complex report, but three full topic readings.",
    whatUserWillUnderstandRu: [
      "Денежные паттерны и ресурсные сценарии",
      "Отношенческие сценарии и близость",
      "Ядро личности и зону роста",
      "Как три темы связаны между собой",
    ],
    whatUserWillUnderstandEn: [
      "Money patterns and resource scenarios",
      "Relationship scenarios and closeness",
      "Personality core and growth zone",
      "How the three topics connect",
    ],
    reportOutlineRu: [
      "MVP: три отдельных отчёта",
      "1. Денежный код (полный outline продукта)",
      "2. Код отношений (полный outline продукта)",
      "3. Личностный портрет (полный outline продукта)",
    ],
    reportOutlineEn: [
      "MVP: three separate reports",
      "1. Money Code (full product outline)",
      "2. Relationships Code (full product outline)",
      "3. Personality Portrait (full product outline)",
    ],
    recommendedForRu: [
      "Тех, кому интересны все три темы",
      "Тех, кто хочет выгоднее, чем покупать по отдельности",
    ],
    recommendedForEn: [
      "Those interested in all three topics",
      "Those wanting better value than buying separately",
    ],
    notForRu: ["Тех, кому нужен один объединённый сложный отчёт в MVP"],
    notForEn: ["Those expecting one combined complex report in MVP"],
    estimatedPagesRu: "3 отчёта по 15–20 страниц",
    estimatedPagesEn: "3 reports, 15–20 pages each",
    primaryCTARu: "Получить Bundle",
    primaryCTAEn: "Get Bundle",
    faqRu: [
      {
        question: "Это один большой отчёт или три?",
        answer: "Три отдельных отчёта — по одному на каждую тему. MVP не объединяет их в один сложный документ.",
      },
    ],
    faqEn: [
      {
        question: "Is it one big report or three?",
        answer: "Three separate reports — one per topic. MVP does not merge them into one complex document.",
      },
    ],
    disclaimerRu: "Bundle не включает Полный портрет и Premium-разбор.",
    disclaimerEn: "Bundle does not include Full Portrait or Premium consultation.",
  },
  main_natal_portrait: {
    shortDescriptionRu: "Исчерпывающий натальный портрет по всем ключевым сферам жизни.",
    shortDescriptionEn: "Comprehensive natal portrait across all key life areas.",
    longDescriptionRu:
      "Полный астрологический портрет связывает личность, деньги, карьеру и отношения в единую стратегию развития.",
    longDescriptionEn:
      "Full Astrological Portrait connects personality, money, career, and relationships into one development strategy.",
    whatUserWillUnderstandRu: [
      "Главную архитектуру карты",
      "Связь личности, денег, карьеры и отношений",
      "Повторяющиеся сценарии и приоритеты развития",
      "Персональную стратегию и переход к Premium",
    ],
    whatUserWillUnderstandEn: [
      "Main chart architecture",
      "Link between personality, money, career, and relationships",
      "Repeating scenarios and development priorities",
      "Personal strategy and path to Premium",
    ],
    reportOutlineRu: [
      "Обложка",
      "Введение",
      "Базовые данные карты",
      "Главная архитектура карты",
      "Главная формула личности",
      "Личность",
      "Деньги",
      "Карьера и статус",
      "Отношения",
      "Сложные зоны",
      "Повторяющиеся сценарии",
      "Связь личности, денег, карьеры и отношений",
      "Сильные стороны",
      "Приоритеты развития",
      "Персональная стратегия",
      "Итоговая таблица",
      "Главный вывод",
      "Переход в Premium",
    ],
    reportOutlineEn: [
      "Cover",
      "Introduction",
      "Basic chart data",
      "Main chart architecture",
      "Main personality formula",
      "Personality",
      "Money",
      "Career and status",
      "Relationships",
      "Complex zones",
      "Repeating scenarios",
      "Link between personality, money, career, relationships",
      "Strengths",
      "Development priorities",
      "Personal strategy",
      "Summary table",
      "Main conclusion",
      "Transition to Premium",
    ],
    recommendedForRu: [
      "Тех, кто хочет полную картину жизни",
      "Тех, кто готов к глубокому разбору",
      "Тех, кто рассматривает Premium после основного продукта",
    ],
    recommendedForEn: [
      "Those wanting a full life picture",
      "Those ready for deep reading",
      "Those considering Premium after the main product",
    ],
    notForRu: [
      "Конкретного личного вопроса",
      "Живой консультации",
      "Точного прогноза событий",
    ],
    notForEn: [
      "A specific personal question",
      "Live consultation",
      "Exact event prediction",
    ],
    estimatedPagesRu: "40–50 страниц",
    estimatedPagesEn: "40–50 pages",
    primaryCTARu: "Получить полный портрет",
    primaryCTAEn: "Get Full Portrait",
    faqRu: [
      {
        question: "Включены ли транзиты?",
        answer: "Только если внешний Astro backend явно поддерживает транзиты для этого продукта.",
      },
    ],
    faqEn: [
      {
        question: "Are transits included?",
        answer: "Only if the external Astro backend explicitly supports transits for this product.",
      },
    ],
    disclaimerRu:
      "Разбор не заменяет консультацию и не предсказывает конкретные события.",
    disclaimerEn:
      "This reading does not replace consultation and does not predict specific events.",
  },
  premium_consultation: {
    shortDescriptionRu: "Личный запрос с ручной обработкой экспертом платформы.",
    shortDescriptionEn: "Personal request manually processed by a platform expert.",
    longDescriptionRu:
      "Premium-разбор для закрытого пилота: вы отправляете личный вопрос и контекст, команда обрабатывает заявку вручную и прикрепляет результат, когда он готов.",
    longDescriptionEn:
      "Premium consultation for closed pilot: you submit a personal question and context, the team processes it manually and attaches the result when ready.",
    whatUserWillUnderstandRu: [
      "Как подать личный запрос",
      "Как отслеживать статус заявки",
      "Что входит в ручную обработку",
      "Когда будет доступен финальный PDF или резюме",
    ],
    whatUserWillUnderstandEn: [
      "How to submit a personal request",
      "How to track request status",
      "What manual processing includes",
      "When the final PDF or summary will be available",
    ],
    reportOutlineRu: [
      "Личный запрос",
      "Ручная обработка",
      "Приоритетная проверка",
      "Возможность учесть контекст",
      "Статус заявки в кабинете",
      "Финальное резюме/PDF URL при наличии",
    ],
    reportOutlineEn: [
      "Personal request",
      "Manual processing",
      "Priority review",
      "Context can be considered",
      "Request status in account",
      "Final summary/PDF URL when available",
    ],
    recommendedForRu: [
      "Тех, у кого есть конкретный личный вопрос",
      "Тех, кому нужен экспертный взгляд с контекстом",
    ],
    recommendedForEn: [
      "Those with a specific personal question",
      "Those needing expert review with context",
    ],
    notForRu: [
      "Мгновенной автоматической доставки",
      "Автоматического подбора эксперта и календаря",
    ],
    notForEn: [
      "Instant automatic delivery",
      "Automatic expert matching and scheduling",
    ],
    estimatedPagesRu: "Индивидуально",
    estimatedPagesEn: "Individual",
    primaryCTARu: "Оставить заявку",
    primaryCTAEn: "Submit Request",
    faqRu: [
      {
        question: "Когда будет готов результат?",
        answer: "В пилоте обработка ручная — срок зависит от загрузки экспертов. Статус виден в кабинете.",
      },
      {
        question: "Можно ли записаться на звонок через приложение?",
        answer: "В MVP нет автоматического календаря — созвон может быть организован вручную вне приложения.",
      },
    ],
    faqEn: [
      {
        question: "When will the result be ready?",
        answer: "In pilot mode processing is manual — timing depends on expert load. Status is visible in your account.",
      },
      {
        question: "Can I schedule a call in the app?",
        answer: "MVP has no automatic calendar — calls may be arranged manually outside the app.",
      },
    ],
    disclaimerRu:
      "Premium-разбор обрабатывается вручную и не гарантирует мгновенную доставку.",
    disclaimerEn:
      "Premium consultation is processed manually and does not guarantee instant delivery.",
  },
};
