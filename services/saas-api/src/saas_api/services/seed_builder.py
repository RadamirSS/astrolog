from copy import deepcopy
from datetime import UTC, datetime


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat().replace("+00:00", "Z")


def create_default_products(slug: str) -> list[dict]:
    """Approved 7-product line — mirrors packages/tenant-config product-catalog."""
    defs = [
        {
            "product_type": "free_report",
            "level": "free",
            "slug": "free-mini-report",
            "title": "Мини-разбор",
            "description": "Короткий персональный разбор по Солнцу, Луне и Асценденту.",
            "price_label": "Бесплатно",
            "price": 0,
            "cta_label": "Получить мини-разбор",
            "cta_action": "coming-soon",
            "featured": True,
            "sort_order": 0,
            "legacy_type": "report",
        },
        {
            "product_type": "low_ticket_money",
            "level": "low_ticket",
            "slug": "money-code",
            "title": "Денежный код",
            "description": "Глубокий разбор денежных паттернов через натальную карту.",
            "price_label": "$29",
            "price": 29,
            "cta_label": "Получить Денежный код",
            "cta_action": "coming-soon",
            "featured": True,
            "sort_order": 1,
            "legacy_type": "report",
        },
        {
            "product_type": "low_ticket_relationships",
            "level": "low_ticket",
            "slug": "relationships-code",
            "title": "Код отношений",
            "description": "Разбор отношенческих сценариев и паттернов близости.",
            "price_label": "$29",
            "price": 29,
            "cta_label": "Получить Код отношений",
            "cta_action": "coming-soon",
            "featured": True,
            "sort_order": 2,
            "legacy_type": "report",
        },
        {
            "product_type": "low_ticket_personality",
            "level": "low_ticket",
            "slug": "personality-portrait",
            "title": "Личностный портрет",
            "description": "Глубокий портрет личности: суть, таланты и зона роста.",
            "price_label": "$29",
            "price": 29,
            "cta_label": "Получить Личностный портрет",
            "cta_action": "coming-soon",
            "featured": False,
            "sort_order": 3,
            "legacy_type": "report",
        },
        {
            "product_type": "bundle_all_topics",
            "level": "bundle",
            "slug": "bundle-three-topics",
            "title": "Bundle: 3 темы",
            "description": "Три глубоких разбора по всем ключевым темам.",
            "price_label": "$79",
            "price": 79,
            "cta_label": "Получить Bundle",
            "cta_action": "coming-soon",
            "featured": True,
            "sort_order": 4,
            "legacy_type": "report",
        },
        {
            "product_type": "main_natal_portrait",
            "level": "main",
            "slug": "full-natal-portrait",
            "title": "Полный астрологический портрет",
            "description": "Исчерпывающий натальный портрет по всем сферам жизни.",
            "price_label": "$149",
            "price": 149,
            "cta_label": "Получить полный портрет",
            "cta_action": "coming-soon",
            "featured": True,
            "sort_order": 5,
            "legacy_type": "natal",
        },
        {
            "product_type": "premium_consultation",
            "level": "premium",
            "slug": "premium-consultation",
            "title": "Premium-разбор",
            "description": "Индивидуальный разбор с живым астрологом.",
            "price_label": "По запросу",
            "price": 0,
            "cta_label": "Оставить заявку",
            "cta_action": "request",
            "featured": False,
            "sort_order": 6,
            "legacy_type": "consultation",
        },
    ]
    products = []
    for defn in defs:
        item = {
            "id": f"{slug}-{defn['slug']}",
            "slug": defn["slug"],
            "type": defn["legacy_type"],
            "productType": defn["product_type"],
            "level": defn["level"],
            "title": defn["title"],
            "description": defn["description"],
            "priceLabel": defn["price_label"],
            "price": defn.get("price", 0),
            "currency": "USD",
            "ctaLabel": defn["cta_label"],
            "ctaAction": defn["cta_action"],
            "featured": defn["featured"],
            "sortOrder": defn["sort_order"],
            "status": "active",
        }
        if defn["product_type"].startswith("low_ticket"):
            theme = defn["product_type"].replace("low_ticket_", "")
            item["theme"] = theme
        products.append(item)
    return products


def create_default_tenant_config(
    tenant_id: str,
    slug: str,
    display_name: str,
    preset: str = "cosmic-violet",
) -> dict:
    now = _utc_now_iso()
    return {
        "tenantId": tenant_id,
        "slug": slug,
        "status": "active",
        "version": 1,
        "brand": {
            "displayName": display_name,
            "tagline": "Discover your cosmic path",
            "supportEmail": f"hello@{slug.replace('-', '')}.demo.astrology.app",
        },
        "theme": {"preset": preset, "overrides": {}},
        "content": {
            "home": {
                "headline": f"Welcome to {display_name}",
                "subheadline": "Your personalized astrology journey starts here.",
                "ctaLabel": "Get My Free Reading",
            },
            "onboarding": {
                "welcomeText": "Tell us about your birth details to unlock your free reading.",
                "birthDateLabel": "Birth Date",
                "birthTimeLabel": "Birth Time (optional)",
                "birthPlaceLabel": "Birth Place",
            },
            "reportIntro": "Here is your personalized snapshot based on your birth profile.",
            "productsIntro": "Go deeper with premium offerings from your astrologer.",
            "paywall": {
                "title": "Unlock Full Access",
                "subtitle": "Premium insights and deeper readings await you.",
            },
            "loadingMessages": [
                "Reading the stars for you...",
                "Aligning your cosmic blueprint...",
                "Almost ready...",
            ],
            "profileLabels": {
                "name": "Name",
                "birthDate": "Birth Date",
                "birthPlace": "Birth Place",
            },
        },
        "modules": {
            "onboarding": True,
            "freeReport": True,
            "products": True,
            "profile": True,
            "payments": {"enabled": False},
            "telegram": {"botConnected": False},
            "analytics": {"enabled": False},
        },
        "products": create_default_products(slug),
        "miniApp": {
            "publicSlug": slug,
            "visualPack": "cosmic_pastel",
            "defaultTopic": None,
            "publicStatus": "published",
        },
        "meta": {"createdAt": now, "updatedAt": now},
    }


def publish_config_copy(config: dict, *, version: int | None = None) -> dict:
    published = deepcopy(config)
    published["version"] = version if version is not None else config.get("version", 1)
    now = _utc_now_iso()
    published["publishedAt"] = now
    meta = published.get("meta") or {}
    meta["updatedAt"] = now
    meta.setdefault("createdAt", now)
    published["meta"] = meta
    return published


def build_mystic_config() -> dict:
    config = create_default_tenant_config(
        "tenant_mystic", "mystic-dark", "Mystic Veil Astrology", "mystic-dark"
    )
    config["content"]["home"].update(
        {
            "headline": "Reveal Your Cosmic Blueprint",
            "subheadline": "Ancient symbols. Modern clarity. For seekers of insight.",
            "ctaLabel": "Reveal My Chart",
        }
    )
    config["brand"].update(
        {
            "name": "Seraphina Vale",
            "tagline": "Where shadow meets starlight",
            "bio": "Tarot-infused natal readings for the spiritually curious.",
            "avatarUrl": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
            "coverUrl": "https://images.unsplash.com/photo-1462336530614-9b09155c37a8?w=800&h=400&fit=crop",
            "telegramUsername": "mysticveil_bot",
        }
    )
    config["miniApp"] = {
        "publicSlug": "nicole",
        "visualPack": "pink_love",
        "defaultTopic": "relationships",
        "publicStatus": "published",
        "partnerId": "partner_nicole",
        "partnerSlug": "nicole",
        "partnerName": "Nicole Astrology",
        "partnerStatus": "active",
    }
    return config


def build_soft_config() -> dict:
    config = create_default_tenant_config(
        "tenant_soft", "soft-feminine", "Rose Moon Readings", "soft-feminine"
    )
    config["content"]["home"].update(
        {
            "headline": "Your Heart Knows the Way",
            "subheadline": "Gentle astrology for soulful women on their journey.",
            "ctaLabel": "Start My Reading",
        }
    )
    config["brand"].update(
        {
            "name": "Rose Hartwell",
            "tagline": "Soft guidance for tender hearts",
            "bio": "Feminine-centered astrology with compassion at the core.",
            "avatarUrl": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
            "coverUrl": "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
            "instagramUrl": "https://instagram.com/rosemoonreadings",
        }
    )
    config["modules"]["profile"] = False
    return config


def build_luxury_config() -> dict:
    config = create_default_tenant_config(
        "tenant_luxury", "luxury-gold", "Celestial Elite", "luxury-gold"
    )
    config["content"]["home"].update(
        {
            "headline": "Your Destiny, Curated",
            "subheadline": "Bespoke astrological counsel for discerning clients.",
            "ctaLabel": "Request Private Reading",
        }
    )
    config["brand"].update(
        {
            "name": "Alexandra Sterling",
            "tagline": "Premium celestial advisory",
            "bio": "White-glove astrology for executives and creatives.",
            "avatarUrl": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
            "coverUrl": "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop",
            "telegramUsername": "celestialelite_bot",
        }
    )
    return config


DEMO_TENANTS = [
    {
        "id": "tenant_mystic",
        "slug": "mystic-dark",
        "status": "active",
        "owner_email": "mystic@mysticveil.demo.astrology.app",
        "build_config": build_mystic_config,
    },
    {
        "id": "tenant_soft",
        "slug": "soft-feminine",
        "status": "active",
        "owner_email": "rose@rosemoon.demo.astrology.app",
        "build_config": build_soft_config,
    },
    {
        "id": "tenant_luxury",
        "slug": "luxury-gold",
        "status": "active",
        "owner_email": "elite@celestialelite.demo.astrology.app",
        "build_config": build_luxury_config,
    },
]
