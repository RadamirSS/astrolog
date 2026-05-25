from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.tenant import Tenant
from saas_api.db.session import get_db
from saas_api.services import public_tenant_service

router = APIRouter(prefix="/api/tenant", tags=["public-tenant"])


@router.get("/{slug}/config")
def get_tenant_config(
    slug: str,
    request: Request,
    preview: str | None = None,
    db: Session = Depends(get_db),
) -> dict:
    if preview == "draft":
        raise AppError(
            ApiErrorCode.FORBIDDEN,
            "Draft preview is not available on public endpoints",
            status_code=403,
        )
    data = public_tenant_service.get_published_config_by_slug(db, slug)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{slug}/config/published")
def get_published_config(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    from saas_api.services.config_service import get_published_config

    tenant = db.query(Tenant).filter(Tenant.slug == slug).first()
    if not tenant:
        raise AppError(ApiErrorCode.TENANT_NOT_FOUND, "Tenant not found", status_code=404)
    public_tenant_service.ensure_public_runtime_tenant(tenant)
    data = get_published_config(db, tenant.id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{slug}/products")
def get_products(
    slug: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    data = public_tenant_service.get_products_by_slug(db, slug)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{slug}/products/{product_id}")
def get_product(
    slug: str,
    product_id: str,
    request: Request,
    db: Session = Depends(get_db),
) -> dict:
    data = public_tenant_service.get_product_by_slug(db, slug, product_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
