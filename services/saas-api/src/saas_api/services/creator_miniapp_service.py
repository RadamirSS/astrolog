from __future__ import annotations

import re
from copy import deepcopy
from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.services.config_service import get_draft_config, publish_config, save_draft_config

SLUG_RE = re.compile(r"^[a-z0-9-]+$")
REFERENCE_VISUAL_PACKS = {"sky_clarity", "dark_gold_mystic", "pink_love", "cosmic_pastel"}
REAL_PRODUCT_TYPES = {
    "free_report",
    "low_ticket_money",
    "low_ticket_relationships",
    "low_ticket_personality",
    "bundle_all_topics",
    "main_natal_portrait",
    "premium_consultation",
}


def _get_draft_row(db: Session, tenant_id: str) -> TenantConfig | None:
    return (
        db.query(TenantConfig)
        .filter(TenantConfig.tenant_id == tenant_id, TenantConfig.kind == ConfigKind.DRAFT)
        .first()
    )


def _ensure_surfaces(mini_app: dict, slug: str) -> dict:
    if mini_app.get("surfaces"):
        return mini_app
    surfaces = []
    for surface_type, prefix in [
        ("telegram_mini_app", f"/b/{slug}"),
        ("website", f"/s/{slug}"),
        ("mobile_web", f"/m/{slug}"),
    ]:
        config_json: dict[str, Any]
        if surface_type == "telegram_mini_app":
            config_json = {"botStatus": "not_connected", "miniAppUrl": prefix}
        elif surface_type == "website":
            config_json = {"slug": slug, "publicUrl": prefix, "previewUrl": f"{prefix}?preview=draft"}
        else:
            config_json = {
                "publicUrl": prefix,
                "installableHintEnabled": True,
                "bottomNavEnabled": True,
            }
        surfaces.append(
            {
                "id": f"surface_{surface_type}",
                "type": surface_type,
                "status": "disabled" if surface_type == "telegram_mini_app" else "draft",
                "publicUrl": prefix,
                "previewUrl": f"{prefix}?preview=draft",
                "configJson": config_json,
            }
        )
    return {**mini_app, "surfaces": surfaces}


def validate_mini_app_publish(config: dict) -> list[dict[str, str]]:
    errors: list[dict[str, str]] = []
    mini_app = config.get("miniApp") or {}
    slug = str(mini_app.get("publicSlug") or "").strip()
    if not slug:
        errors.append({"path": "miniApp.publicSlug", "message": "Public slug is required"})
    elif not SLUG_RE.match(slug):
        errors.append({"path": "miniApp.publicSlug", "message": "Invalid public slug"})

    brand = config.get("brand") or {}
    if not str(brand.get("displayName") or "").strip():
        errors.append({"path": "brand.displayName", "message": "Mini app name is required"})

    products = config.get("products") or []
    active = [p for p in products if p.get("status") == "active"]
    if not any(p.get("productType") == "free_report" for p in active):
        errors.append({"path": "products", "message": "Free report must be enabled"})
    if not any(p.get("level") != "free" for p in active):
        errors.append({"path": "products", "message": "At least one paid product must be active"})

    visual_pack = mini_app.get("visualPack")
    if not visual_pack:
        errors.append({"path": "miniApp.visualPack", "message": "Visual pack is required"})
    elif visual_pack not in REFERENCE_VISUAL_PACKS:
        errors.append({"path": "miniApp.visualPack", "message": "Select a reference visual pack"})

    mini_app = _ensure_surfaces(mini_app, slug or "app")
    enabled = [s for s in mini_app.get("surfaces") or [] if s.get("status") != "disabled"]
    if not enabled:
        errors.append({"path": "miniApp.surfaces", "message": "Select at least one publication surface"})

    for surface in enabled:
        if surface.get("type") == "telegram_mini_app":
            tg = surface.get("configJson") or {}
            if tg.get("botStatus") not in {"connected", "webhook_configured"}:
                errors.append(
                    {
                        "path": "miniApp.surfaces.telegram",
                        "message": "Connect Telegram bot before publishing",
                    }
                )

    for product in active:
        product_type = product.get("productType")
        if product_type and product_type not in REAL_PRODUCT_TYPES:
            errors.append({"path": "products", "message": f"Unsupported product type: {product_type}"})

    return errors


def build_creator_mini_app_response(config: dict) -> dict:
    mini_app = _ensure_surfaces(config.get("miniApp") or {}, config.get("slug", ""))
    brand = config.get("brand") or {}
    content_home = (config.get("content") or {}).get("home") or {}
    status = (
        "published"
        if mini_app.get("publicStatus") == "published"
        else "paused"
        if mini_app.get("publicStatus") == "paused"
        else "draft"
    )
    return {
        "id": f"miniapp_{config.get('tenantId')}",
        "tenantId": config.get("tenantId"),
        "creatorId": config.get("tenantId"),
        "slug": mini_app.get("publicSlug"),
        "name": mini_app.get("name") or brand.get("displayName"),
        "status": status,
        "defaultVisualPack": mini_app.get("visualPack"),
        "defaultTopic": mini_app.get("defaultTopic"),
        "activeProducts": [p["id"] for p in (config.get("products") or []) if p.get("status") == "active"],
        "branding": {
            "displayName": brand.get("displayName"),
            "avatarUrl": brand.get("avatarUrl"),
            "bio": brand.get("bio"),
            "heroTitle": content_home.get("headline"),
            "heroSubtitle": content_home.get("subheadline"),
            "ctaText": content_home.get("ctaLabel"),
        },
        "surfaces": [
            {
                "id": s.get("id"),
                "type": s.get("type"),
                "status": s.get("status"),
                "publicUrl": s.get("publicUrl"),
                "previewUrl": s.get("previewUrl"),
                "configJson": _sanitize_surface_config(s.get("configJson") or {}),
                "publishedAt": s.get("publishedAt"),
            }
            for s in mini_app.get("surfaces") or []
        ],
        "publishedAt": config.get("publishedAt"),
        "updatedAt": (config.get("meta") or {}).get("updatedAt"),
    }


def _sanitize_surface_config(config_json: dict) -> dict:
    sanitized = dict(config_json)
    for key in ("token", "encryptedToken", "encrypted_token", "encryptedTokenRef", "secretRef"):
        sanitized.pop(key, None)
    return sanitized


def get_creator_mini_app(db: Session, tenant_id: str) -> dict:
    config = get_draft_config(db, tenant_id)
    return build_creator_mini_app_response(config)


def update_creator_mini_app(db: Session, tenant_id: str, patch: dict, actor) -> dict:
    config = deepcopy(get_draft_config(db, tenant_id))
    brand = config.setdefault("brand", {})
    content = config.setdefault("content", {})
    home = content.setdefault("home", {})
    mini_app = _ensure_surfaces(config.setdefault("miniApp", {}), config.get("slug", ""))

    branding = patch.get("branding") or {}
    if branding.get("displayName"):
        brand["displayName"] = branding["displayName"]
    if "avatarUrl" in branding:
        brand["avatarUrl"] = branding["avatarUrl"]
    if "bio" in branding:
        brand["bio"] = branding["bio"]
    if branding.get("heroTitle"):
        home["headline"] = branding["heroTitle"]
    if branding.get("heroSubtitle") is not None:
        home["subheadline"] = branding["heroSubtitle"]
    if branding.get("ctaText"):
        home["ctaLabel"] = branding["ctaText"]
    if patch.get("slug"):
        mini_app["publicSlug"] = patch["slug"]
    if patch.get("defaultVisualPack"):
        mini_app["visualPack"] = patch["defaultVisualPack"]
    if "defaultTopic" in patch:
        mini_app["defaultTopic"] = patch["defaultTopic"]
    if patch.get("name"):
        mini_app["name"] = patch["name"]

    config["miniApp"] = _ensure_surfaces(mini_app, mini_app.get("publicSlug") or config.get("slug", ""))
    saved = save_draft_config(db, tenant_id, config, actor)
    return build_creator_mini_app_response(saved)


def update_surface_config(db: Session, tenant_id: str, surface_id: str, patch: dict, actor) -> dict:
    config = deepcopy(get_draft_config(db, tenant_id))
    mini_app = _ensure_surfaces(config.setdefault("miniApp", {}), config.get("slug", ""))
    surfaces = mini_app.get("surfaces") or []
    updated = False
    for surface in surfaces:
        if surface.get("id") == surface_id:
            if patch.get("status"):
                surface["status"] = patch["status"]
            if patch.get("configJson"):
                surface["configJson"] = {**(surface.get("configJson") or {}), **patch["configJson"]}
            updated = True
            break
    if not updated:
        raise AppError(ApiErrorCode.NOT_FOUND, "Surface not found", status_code=404)
    config["miniApp"] = mini_app
    saved = save_draft_config(db, tenant_id, config, actor)
    return build_creator_mini_app_response(saved)


def set_surface_enabled(db: Session, tenant_id: str, surface_type: str, enabled: bool, actor) -> dict:
    config = deepcopy(get_draft_config(db, tenant_id))
    mini_app = _ensure_surfaces(config.setdefault("miniApp", {}), config.get("slug", ""))
    for surface in mini_app.get("surfaces") or []:
        if surface.get("type") == surface_type:
            surface["status"] = "draft" if enabled else "disabled"
    config["miniApp"] = mini_app
    saved = save_draft_config(db, tenant_id, config, actor)
    return build_creator_mini_app_response(saved)


def publish_creator_mini_app(db: Session, tenant_id: str, actor) -> dict:
    config = get_draft_config(db, tenant_id)
    errors = validate_mini_app_publish(config)
    if errors:
        raise AppError(ApiErrorCode.PUBLISH_FAILED, errors[0]["message"], status_code=400)
    published = publish_config(db, tenant_id, actor)
    return build_creator_mini_app_response(published)


def sync_telegram_surface_in_draft(db: Session, tenant_id: str, status: dict, actor) -> None:
    config = deepcopy(get_draft_config(db, tenant_id))
    mini_app = _ensure_surfaces(config.setdefault("miniApp", {}), config.get("slug", ""))
    for surface in mini_app.get("surfaces") or []:
        if surface.get("type") == "telegram_mini_app":
            surface["configJson"] = {
                **(surface.get("configJson") or {}),
                "botIntegrationId": status.get("integrationId"),
                "botUsername": status.get("botUsername"),
                "botDisplayName": status.get("botDisplayName"),
                "botStatus": status.get("status") if status.get("status") != "disconnected" else "not_connected",
                "webhookStatus": status.get("webhookStatus"),
                "miniAppUrl": status.get("miniAppUrl"),
                "deepLink": status.get("deepLink"),
                "lastValidatedAt": status.get("lastValidatedAt"),
            }
            if status.get("status") in {"connected", "webhook_configured"}:
                surface["status"] = "configured"
    config["miniApp"] = mini_app
    save_draft_config(db, tenant_id, config, actor)
