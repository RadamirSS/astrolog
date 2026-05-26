from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.sessions import create_end_user_session_token, set_end_user_session_cookie
from saas_api.auth.telegram import validate_telegram_init_data
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from saas_api.schemas.telegram import EndUserSummary, ValidateInitDataRequest, ValidateInitDataResponse
from saas_api.services.end_user_service import end_user_to_summary, upsert_end_user
from saas_api.services.public_tenant_service import ensure_public_runtime_tenant, _get_tenant_by_slug

router = APIRouter(prefix="/api/telegram", tags=["telegram"])


@router.post("/validate-init-data")
def validate_init_data(
    body: ValidateInitDataRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    tenant = _get_tenant_by_slug(db, body.tenant_slug)
    ensure_public_runtime_tenant(tenant)

    user_data = validate_telegram_init_data(body.init_data)
    end_user = upsert_end_user(db, tenant_id=tenant.id, user_data=user_data)

    token = create_end_user_session_token(
        end_user_id=end_user.id,
        tenant_id=end_user.tenant_id,
        telegram_id=end_user.telegram_id,
    )
    set_end_user_session_cookie(response, token)

    data = ValidateInitDataResponse(user=end_user_to_summary(end_user))
    return success_response(
        data.model_dump(by_alias=True),
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/webhook/{integration_id}")
def telegram_webhook_placeholder(integration_id: str, request: Request) -> dict:
    """Safe placeholder webhook — no conversation logic in this package."""
    return success_response({"ok": True, "integrationId": integration_id}, request_id=getattr(request.state, "request_id", None))
