from __future__ import annotations

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.tenant import TenantStatus
from saas_api.services.config_service import find_published_by_public_slug
from saas_api.services.public_miniapp_service import resolve_public_partner

SURFACE_TYPE_MAP = {
    "telegram": "telegram_mini_app",
    "website": "website",
    "mobile": "mobile_web",
}


def resolve_public_surface(db: Session, surface_segment: str, slug: str) -> dict:
    surface_type = SURFACE_TYPE_MAP.get(surface_segment)
    if not surface_type:
        raise AppError(ApiErrorCode.NOT_FOUND, "Unknown surface type", status_code=404)

    if surface_segment == "telegram":
        partner = resolve_public_partner(db, slug)
        return {
            **partner,
            "surfaceType": surface_type,
            "publicLinks": {
                **partner.get("publicLinks", {}),
                "website": f"/s/{slug}",
                "mobile": f"/m/{slug}",
                "telegram": f"/b/{slug}",
            },
            "seoTitle": partner.get("miniAppName"),
            "seoDescription": partner.get("heroSubtitle"),
            "bottomNavEnabled": False,
            "installableHintEnabled": False,
        }

    match = find_published_by_public_slug(db, slug)
    if not match:
        raise AppError(ApiErrorCode.NOT_FOUND, "Surface not found", status_code=404)

    tenant, published = match
    if tenant.status != TenantStatus.ACTIVE:
        raise AppError(ApiErrorCode.FORBIDDEN, "Mini app is unavailable", status_code=403)

    mini_app = published.get("miniApp") or {}
    public_status = mini_app.get("publicStatus")
    if public_status != "published":
        raise AppError(ApiErrorCode.FORBIDDEN, "Mini app is not published", status_code=403)

    surfaces = mini_app.get("surfaces") or []
    surface = next((s for s in surfaces if s.get("type") == surface_type), None)
    if surface and surface.get("status") == "disabled":
        raise AppError(ApiErrorCode.FORBIDDEN, "Surface is disabled", status_code=403)
    if surface and surface.get("status") not in {None, "configured", "published", "draft"}:
        if surface.get("status") == "error":
            raise AppError(ApiErrorCode.FORBIDDEN, "Surface is unavailable", status_code=403)

    partner = resolve_public_partner(db, slug)
    partner["surfaceType"] = surface_type
    partner["publicLinks"] = {
        **partner.get("publicLinks", {}),
        "website": f"/s/{slug}",
        "mobile": f"/m/{slug}",
        "telegram": f"/b/{slug}",
    }
    if surface_segment == "website":
        web = (surface or {}).get("configJson") or {}
        partner["seoTitle"] = web.get("seoTitle") or partner.get("miniAppName")
        partner["seoDescription"] = web.get("seoDescription") or partner.get("heroSubtitle")
        partner["bottomNavEnabled"] = False
        partner["installableHintEnabled"] = False
    else:
        mobile = (surface or {}).get("configJson") or {}
        partner["bottomNavEnabled"] = mobile.get("bottomNavEnabled", True)
        partner["installableHintEnabled"] = mobile.get("installableHintEnabled", True)

    for key in ("token", "encryptedToken", "commissionRate", "balance", "payout"):
        partner.pop(key, None)

    return partner
