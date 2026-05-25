from __future__ import annotations

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.tenant import TenantStatus
from saas_api.services.config_service import find_published_by_public_slug

ALLOWED_TOPICS = ["money", "relationships", "personality"]


def _build_public_links(slug: str) -> dict[str, str]:
    prefix = f"/b/{slug}"
    return {
        "general": prefix,
        "money": f"{prefix}/money",
        "relationships": f"{prefix}/relationships",
        "personality": f"{prefix}/personality",
    }


def _resolve_partner_id(tenant_id: str, mini_app: dict) -> str:
    return str(mini_app.get("partnerId") or f"partner_{tenant_id}")


def resolve_public_partner(db: Session, slug: str) -> dict:
    match = find_published_by_public_slug(db, slug)
    if not match:
        raise AppError(ApiErrorCode.NOT_FOUND, "Partner not found", status_code=404)

    tenant, published = match
    if tenant.status != TenantStatus.ACTIVE:
        raise AppError(ApiErrorCode.FORBIDDEN, "Mini app is unavailable", status_code=403)

    mini_app = published.get("miniApp") or {}
    public_slug = str(mini_app.get("publicSlug") or slug)
    public_status = mini_app.get("publicStatus")
    if public_status is None:
        public_status = "published" if published.get("status") == "active" else "draft"

    partner_status = str(mini_app.get("partnerStatus") or "active")
    if partner_status != "active":
        raise AppError(ApiErrorCode.FORBIDDEN, "Partner is unavailable", status_code=403)
    if public_status != "published":
        raise AppError(ApiErrorCode.FORBIDDEN, "Mini app is not published", status_code=403)

    brand = published.get("brand") or {}
    content_home = (published.get("content") or {}).get("home") or {}
    visual_pack = mini_app.get("visualPack") or "brand_default"
    partner_id = _resolve_partner_id(tenant.id, mini_app)
    partner_slug = str(mini_app.get("partnerSlug") or public_slug)
    partner_name = str(
        mini_app.get("partnerName") or brand.get("displayName") or brand.get("name") or public_slug
    )

    active_products = []
    for product in published.get("products") or []:
        if product.get("status") != "active":
            continue
        active_products.append(
            {
                "productId": product.get("id"),
                "productType": product.get("productType"),
                "title": product.get("title"),
                "priceLabel": product.get("priceLabel"),
                "level": product.get("level"),
            }
        )

    return {
        "partnerId": partner_id,
        "partnerSlug": partner_slug,
        "partnerName": partner_name,
        "tenantId": tenant.id,
        "tenantSlug": tenant.slug,
        "creatorId": partner_id,
        "slug": public_slug,
        "status": "published",
        "miniAppName": brand.get("name") or brand.get("displayName") or partner_name,
        "creatorDisplayName": brand.get("displayName") or partner_name,
        "shortBio": brand.get("bio"),
        "avatarUrl": brand.get("avatarUrl"),
        "heroTitle": content_home.get("headline") or partner_name,
        "heroSubtitle": content_home.get("subheadline") or "",
        "visualPack": visual_pack,
        "defaultTopic": mini_app.get("defaultTopic"),
        "activeProducts": active_products,
        "publicLinks": _build_public_links(public_slug),
        "allowedTopics": ALLOWED_TOPICS,
        "campaignId": mini_app.get("campaignId"),
    }
