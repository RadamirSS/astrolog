import logging
import uuid
from datetime import UTC, datetime

from astro_api.schemas.reports import (
    FreeReportRequest,
    LockedSection,
    Report,
    ReportCta,
    ReportHighlight,
    ReportSection,
)

logger = logging.getLogger(__name__)

TOPIC_LABELS: dict[str, dict[str, str]] = {
    "en": {
        "money": "money",
        "relationships": "relationships",
        "personality": "personality",
    },
    "ru": {
        "money": "деньги",
        "relationships": "отношения",
        "personality": "личность",
    },
}

TOPIC_PRODUCT_SLUG: dict[str, str] = {
    "money": "money-code",
    "relationships": "relationships-code",
    "personality": "personality-portrait",
}

TOPIC_PRODUCT_TITLE: dict[str, dict[str, str]] = {
    "en": {
        "money": "Money Code",
        "relationships": "Relationships Code",
        "personality": "Personality Portrait",
    },
    "ru": {
        "money": "Денежный код",
        "relationships": "Код отношений",
        "personality": "Личностный портрет",
    },
}

STUB_TEMPLATES: dict[str, dict] = {
    "en": {
        "title": "Your Mini Report Is Ready",
        "subtitle": "A first look at your natal chart",
        "summary": (
            "This free reading highlights Sun, Moon, and Ascendant — "
            "the first three key points of your chart."
        ),
        "highlights": [
            {"id": "h1", "label": "Sun Sign", "value": "Scorpio", "icon": "sun"},
            {"id": "h2", "label": "Moon Sign", "value": "Pisces", "icon": "moon"},
            {"id": "h3", "label": "Rising", "value": "Capricorn", "icon": "rising"},
        ],
        "sections": [
            {
                "id": "s1",
                "title": "Core Essence",
                "content": (
                    "Your chart reveals patterns that help you understand yourself "
                    "more clearly — without fatalistic predictions."
                ),
                "order": 0,
                "variant": "highlight",
                "access": "free",
            },
            {
                "id": "s2",
                "title": "Topic Focus",
                "content": (
                    "The area you selected shapes the themes highlighted below. "
                    "This is only the first layer of your chart."
                ),
                "order": 1,
                "access": "free",
            },
        ],
        "cta": {
            "label": "Compare Products",
            "title": "Go Deeper",
            "subtitle": "Unlock full topic scenarios and practical takeaways",
            "buttonLabel": "View Products",
            "action": "navigate_products",
        },
        "topic_suffix": " Your chosen focus — {topic} — shapes the themes highlighted below.",
        "name_prefix": "{name}, ",
    },
    "ru": {
        "title": "Ваш мини-разбор готов",
        "subtitle": "Первый взгляд на вашу натальную карту",
        "summary": (
            "Этот бесплатный разбор показывает Солнце, Луну и Асцендент — "
            "первые три ключевые точки вашей карты."
        ),
        "highlights": [
            {"id": "h1", "label": "Солнце", "value": "Скорпион", "icon": "sun"},
            {"id": "h2", "label": "Луна", "value": "Рыбы", "icon": "moon"},
            {"id": "h3", "label": "Асцендент", "value": "Козерог", "icon": "rising"},
        ],
        "sections": [
            {
                "id": "s1",
                "title": "Ядро личности",
                "content": (
                    "Ваша карта помогает понять себя яснее — "
                    "без фаталистичных предсказаний."
                ),
                "order": 0,
                "variant": "highlight",
                "access": "free",
            },
            {
                "id": "s2",
                "title": "Фокус темы",
                "content": (
                    "Выбранная тема формирует акценты ниже. "
                    "Это только первый слой вашей карты."
                ),
                "order": 1,
                "access": "free",
            },
        ],
        "cta": {
            "label": "Сравнить продукты",
            "title": "Пойти глубже",
            "subtitle": "Откройте полные сценарии и практические выводы",
            "buttonLabel": "К услугам",
            "action": "navigate_products",
        },
        "topic_suffix": " Выбранный фокус — {topic} — формирует темы ниже.",
        "name_prefix": "{name}, ",
    },
}


def resolve_locale(locale: str) -> str:
    normalized = locale.lower().strip()
    if normalized in STUB_TEMPLATES:
        return normalized
    logger.warning("Unsupported locale '%s', falling back to en", locale)
    return "en"


def _topic_product_id(tenant_slug: str, topic: str | None) -> str:
    slug = TOPIC_PRODUCT_SLUG.get(topic or "personality", "personality-portrait")
    return f"{tenant_slug}-{slug}"


def _locked_section(locale: str, tenant_slug: str, topic: str | None) -> dict:
    topic_key = topic if topic in TOPIC_PRODUCT_SLUG else "personality"
    titles = TOPIC_PRODUCT_TITLE.get(locale, TOPIC_PRODUCT_TITLE["en"])
    if locale == "ru":
        teaser = (
            "Полный разбор показывает сценарии, причины и практические выводы "
            "по выбранной теме."
        )
    else:
        teaser = (
            "The full reading shows scenarios, causes, and practical takeaways "
            "for your chosen topic."
        )
    return {
        "id": "l1",
        "title": titles[topic_key],
        "teaser": teaser,
        "unlockProductId": _topic_product_id(tenant_slug, topic_key),
    }


def generate_free_report_stub(request: FreeReportRequest) -> Report:
    locale = resolve_locale(request.locale)
    template = STUB_TEMPLATES[locale]
    topic = request.birth_profile.topic

    summary = template["summary"]
    if request.birth_profile.name:
        summary = template["name_prefix"].format(name=request.birth_profile.name) + summary

    if topic:
        topic_label = TOPIC_LABELS.get(locale, TOPIC_LABELS["en"]).get(
            topic,
            topic.replace("-", " "),
        )
        summary += template["topic_suffix"].format(topic=topic_label)

    report_id = f"report_stub_{uuid.uuid4().hex[:12]}"
    generated_at = datetime.now(UTC).isoformat().replace("+00:00", "Z")

    cta_data = template.get("cta")
    cta = ReportCta(**cta_data) if cta_data else None

    unlock_id = _topic_product_id(request.tenant_slug, topic)
    recommended = [
        unlock_id,
        f"{request.tenant_slug}-bundle-three-topics",
        f"{request.tenant_slug}-full-natal-portrait",
    ]

    return Report(
        id=report_id,
        type="natal",
        title=template["title"],
        subtitle=template["subtitle"],
        summary=summary,
        highlights=[ReportHighlight(**item) for item in template["highlights"]],
        sections=[ReportSection(**item) for item in template["sections"]],
        lockedSections=[LockedSection(**_locked_section(locale, request.tenant_slug, topic))],
        cta=cta,
        recommendedProducts=recommended,
        generatedAt=generated_at,
    )
