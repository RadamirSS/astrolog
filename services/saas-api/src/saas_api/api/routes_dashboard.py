from typing import Any

from fastapi import APIRouter, Depends, File, Form, Query, Request, UploadFile
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.dependencies import (
    assert_tenant_member_or_platform_admin,
    assert_tenant_owner_or_platform_admin,
    get_current_account,
    require_platform_owner_or_admin,
)
from saas_api.db.models.account import Account
from saas_api.db.session import get_db
from saas_api.schemas.auth import CreateTenantRequest, UpdateTenantStatusRequest
from saas_api.services import analytics_service, config_service, media_service, tenant_service

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/tenants")
def list_tenants(
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    data = tenant_service.list_tenants_for_account(db, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/tenants")
def create_tenant(
    body: CreateTenantRequest,
    request: Request,
    account: Account = Depends(require_platform_owner_or_admin),
    db: Session = Depends(get_db),
) -> dict:
    data = tenant_service.create_tenant(
        db,
        slug=body.slug,
        display_name=body.display_name,
        preset=body.preset,
        owner_email=body.owner_email,
        actor=account,
    )
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}")
def get_tenant(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = tenant_service.get_tenant_detail(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.patch("/tenants/{tenant_id}")
def update_tenant_status(
    tenant_id: str,
    body: UpdateTenantStatusRequest,
    request: Request,
    account: Account = Depends(require_platform_owner_or_admin),
    db: Session = Depends(get_db),
) -> dict:
    data = tenant_service.set_tenant_status(db, tenant_id, body.status, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/bundle")
def get_tenant_bundle(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = tenant_service.get_tenant_bundle(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/config/draft")
def get_draft_config(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = config_service.get_draft_config(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.put("/tenants/{tenant_id}/config/draft")
def save_draft_config(
    tenant_id: str,
    config: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    data = config_service.save_draft_config(db, tenant_id, config, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/config/published")
def get_published_config(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = config_service.get_published_config(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/config/status")
def get_config_status(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = config_service.get_config_status(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/tenants/{tenant_id}/publish")
def publish_config(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    data = config_service.publish_config(db, tenant_id, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/tenants/{tenant_id}/discard-draft")
def discard_draft(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    data = config_service.discard_draft(db, tenant_id, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/tenants/{tenant_id}/restore-draft-from-published")
def restore_draft(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    data = config_service.restore_draft_from_published(db, tenant_id, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/stats")
def get_dashboard_stats(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = tenant_service.get_dashboard_stats(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/metrics")
def get_dashboard_metrics(
    tenant_id: str,
    request: Request,
    period: str = Query(default="7d"),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = analytics_service.get_tenant_metrics(db, tenant_id, period)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/tenants/{tenant_id}/media")
async def upload_tenant_media(
    tenant_id: str,
    request: Request,
    file: UploadFile = File(...),
    kind: str = Form(...),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    content = await file.read()
    data = media_service.upload_media(
        db,
        tenant_id=tenant_id,
        kind=kind,
        filename=file.filename or "upload",
        content_type=file.content_type,
        content=content,
        account=account,
    )
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/media")
def list_tenant_media(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = media_service.list_media(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.delete("/tenants/{tenant_id}/media/{asset_id}")
def delete_tenant_media(
    tenant_id: str,
    asset_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_owner_or_platform_admin(db, account, tenant_id)
    data = media_service.delete_media(db, tenant_id, asset_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/tenants/{tenant_id}/summary")
def get_dashboard_summary(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = tenant_service.get_dashboard_summary(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
