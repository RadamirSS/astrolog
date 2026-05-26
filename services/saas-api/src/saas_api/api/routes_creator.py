from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.dependencies import assert_tenant_member_or_platform_admin, get_current_account
from saas_api.db.models.account import Account
from saas_api.db.session import get_db
from saas_api.schemas.creator import (
    ConnectTelegramBotRequest,
    DisconnectTelegramBotRequest,
    SetSurfaceEnabledRequest,
    ValidateTelegramBotRequest,
)
from saas_api.services import creator_miniapp_service, telegram_bot_service

router = APIRouter(prefix="/api/dashboard/tenants", tags=["creator-miniapp"])


@router.get("/{tenant_id}/mini-app")
def get_creator_mini_app(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.get_creator_mini_app(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.put("/{tenant_id}/mini-app")
def update_creator_mini_app(
    tenant_id: str,
    body: dict,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.update_creator_mini_app(db, tenant_id, body, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{tenant_id}/mini-app/publish")
def publish_creator_mini_app(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.publish_creator_mini_app(db, tenant_id, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{tenant_id}/mini-app/unpublish")
def unpublish_creator_mini_app(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    config = creator_miniapp_service.get_creator_mini_app(db, tenant_id)
    draft = creator_miniapp_service.update_creator_mini_app(
        db,
        tenant_id,
        {"status": "draft"},
        account,
    )
    _ = draft
    from saas_api.services.config_service import get_draft_config, save_draft_config
    from copy import deepcopy

    raw = deepcopy(get_draft_config(db, tenant_id))
    mini_app = raw.setdefault("miniApp", {})
    mini_app["publicStatus"] = "draft"
    save_draft_config(db, tenant_id, raw, account)
    data = creator_miniapp_service.get_creator_mini_app(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.put("/{tenant_id}/surfaces/{surface_id}")
def update_surface_config(
    tenant_id: str,
    surface_id: str,
    body: dict,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.update_surface_config(db, tenant_id, surface_id, body, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.put("/{tenant_id}/mini-app/surfaces/{surface_type}/enabled")
def set_surface_enabled(
    tenant_id: str,
    surface_type: str,
    body: SetSurfaceEnabledRequest,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.set_surface_enabled(
        db, tenant_id, surface_type, body.enabled, account
    )
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{tenant_id}/surfaces/{surface_id}/publish")
def publish_surface(
    tenant_id: str,
    surface_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.publish_creator_mini_app(db, tenant_id, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{tenant_id}/surfaces/{surface_id}/preview")
def get_surface_preview(
    tenant_id: str,
    surface_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = creator_miniapp_service.get_creator_mini_app(db, tenant_id)
    surface = next((s for s in data.get("surfaces", []) if s.get("id") == surface_id), None)
    if not surface:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Surface not found", status_code=404)
    return success_response(
        {"previewUrl": surface.get("previewUrl"), "config": data},
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/{tenant_id}/telegram/connect")
async def connect_telegram_bot(
    tenant_id: str,
    body: ConnectTelegramBotRequest,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    draft = creator_miniapp_service.get_creator_mini_app(db, tenant_id)
    slug = draft.get("slug")
    data = await telegram_bot_service.connect_bot(db, tenant_id, body.token, slug)
    creator_miniapp_service.sync_telegram_surface_in_draft(db, tenant_id, data, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{tenant_id}/telegram/disconnect")
def disconnect_telegram_bot(
    tenant_id: str,
    body: DisconnectTelegramBotRequest,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = telegram_bot_service.disconnect_bot(db, tenant_id, body.integration_id)
    creator_miniapp_service.sync_telegram_surface_in_draft(db, tenant_id, data, account)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{tenant_id}/telegram/validate")
async def validate_telegram_bot(
    tenant_id: str,
    body: ValidateTelegramBotRequest,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = await telegram_bot_service.validate_bot_token(body.token)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{tenant_id}/telegram/status")
def get_telegram_status(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)
    data = telegram_bot_service.get_status(db, tenant_id)
    if data is None:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Telegram integration not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
