from typing import Any

from saas_api.services.config_validation import json_equal

CHANGED_AREA_MAP = {
    "brand": "brand",
    "theme": "design",
    "content": "content",
    "products": "products",
    "modules": "modules",
}


def _compare_modules(draft_modules: dict, published_modules: dict) -> bool:
    draft_core = {
        "onboarding": draft_modules.get("onboarding"),
        "freeReport": draft_modules.get("freeReport"),
        "products": draft_modules.get("products"),
        "profile": draft_modules.get("profile"),
    }
    published_core = {
        "onboarding": published_modules.get("onboarding"),
        "freeReport": published_modules.get("freeReport"),
        "products": published_modules.get("products"),
        "profile": published_modules.get("profile"),
    }
    return json_equal(draft_core, published_core)


def get_config_changed_areas(
    draft: dict[str, Any], published: dict[str, Any] | None
) -> list[str]:
    if not published:
        return ["brand", "design", "content", "products", "modules"]

    areas: list[str] = []
    if not json_equal(draft.get("brand"), published.get("brand")):
        areas.append("brand")
    if not json_equal(draft.get("theme"), published.get("theme")):
        areas.append("design")
    if not json_equal(draft.get("content"), published.get("content")):
        areas.append("content")
    if not json_equal(draft.get("products"), published.get("products")):
        areas.append("products")
    if not _compare_modules(draft.get("modules", {}), published.get("modules", {})):
        areas.append("modules")
    return areas


def build_config_status(
    draft: dict[str, Any],
    published: dict[str, Any] | None,
    *,
    draft_version: int,
    published_version: int | None,
    last_published_at: str | None,
) -> dict[str, Any]:
    changed_areas = get_config_changed_areas(draft, published)
    meta = draft.get("meta") or {}
    return {
        "hasUnpublishedChanges": len(changed_areas) > 0,
        "draftUpdatedAt": meta.get("updatedAt") or draft.get("updatedAt"),
        "lastPublishedAt": last_published_at or (published or {}).get("publishedAt"),
        "publishedVersion": published_version,
        "draftVersion": draft_version,
        "changedAreas": changed_areas,
    }
