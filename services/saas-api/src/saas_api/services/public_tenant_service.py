from copy import deepcopy
from datetime import UTC, datetime

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.tenant import Tenant, TenantStatus


def _get_tenant_by_slug(db, slug: str) -> Tenant:
    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise AppError(ApiErrorCode.TENANT_NOT_FOUND, "Tenant not found", status_code=404)
    return tenant


def ensure_public_runtime_tenant(tenant: Tenant) -> None:
    """Public Mini App runtime allows only active tenants."""
    if tenant.status == TenantStatus.ACTIVE:
        return
    if tenant.status == TenantStatus.PAUSED:
        raise AppError(ApiErrorCode.TENANT_PAUSED, "Tenant is paused", status_code=403)
    raise AppError(ApiErrorCode.FORBIDDEN, "Tenant is not published", status_code=403)


def _ensure_not_paused(tenant: Tenant) -> None:
    ensure_public_runtime_tenant(tenant)


def get_published_config_by_slug(db, slug: str) -> dict:
    tenant = _get_tenant_by_slug(db, slug)
    ensure_public_runtime_tenant(tenant)
    from saas_api.services.config_service import get_published_config

    config = get_published_config(db, tenant.id)
    if not config:
        raise AppError(ApiErrorCode.NOT_FOUND, "No published config", status_code=404)
    return config


def get_products_by_slug(db, slug: str) -> list[dict]:
    config = get_published_config_by_slug(db, slug)
    return [p for p in config.get("products", []) if p.get("status") == "active"]


def get_product_by_slug(db, slug: str, product_id: str) -> dict:
    products = get_products_by_slug(db, slug)
    for product in products:
        if product.get("id") == product_id:
            return product
    raise AppError(ApiErrorCode.PRODUCT_NOT_FOUND, "Product not found", status_code=404)
