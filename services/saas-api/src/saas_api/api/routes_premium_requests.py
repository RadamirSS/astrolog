from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from pydantic import BaseModel, Field

from backend_common.envelope import success_response
from saas_api.auth.dependencies import assert_tenant_member_or_platform_admin, get_current_account
from saas_api.auth.end_user_dependencies import get_current_end_user
from saas_api.db.models.account import Account
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from sqlalchemy.orm import Session
from saas_api.services.premium_request_service import (
    create_premium_request,
    get_premium_request_for_tenant,
    get_premium_request_for_user,
    list_premium_requests_for_tenant,
    list_premium_requests_for_user,
    update_premium_request_admin,
)

router = APIRouter(prefix="/api/me/premium-requests", tags=["premium-requests"])
dashboard_router = APIRouter(
    prefix="/api/dashboard/tenants/{tenant_id}/ops/premium-requests",
    tags=["dashboard-premium"],
)


class CreatePremiumRequestBody(BaseModel):
    tenantId: str
    tenantSlug: str
    productId: str | None = None
    productType: str = "premium_consultation"
    productTitle: str
    topic: str
    personalQuestion: str
    context: str | None = None
    contactMethod: str | None = None
    contactValue: str | None = None
    desiredWindow: str | None = None
    consentAccepted: bool
    birthProfile: dict[str, Any] | None = None


class UpdatePremiumRequestBody(BaseModel):
    status: str | None = None
    assignedExpert: str | None = None
    adminNote: str | None = None
    finalPdfUrl: str | None = Field(default=None)


@router.post("")
async def create_premium_request_route(
    body: CreatePremiumRequestBody,
    request: Request,
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = create_premium_request(db, end_user, body.model_dump(by_alias=False))
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("")
async def list_my_premium_requests_route(
    request: Request,
    tenantId: str = Query(...),
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = list_premium_requests_for_user(db, end_user, tenantId)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{request_id}")
async def get_my_premium_request_route(
    request_id: str,
    request: Request,
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = get_premium_request_for_user(db, end_user, request_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


def _assert_access(tenant_id: str, account: Account, db: Session) -> None:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)


@dashboard_router.get("")
def list_premium_requests_route(
    tenant_id: str,
    request: Request,
    status: str | None = None,
    topic: str | None = None,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    data = list_premium_requests_for_tenant(db, tenant_id, {"status": status, "topic": topic})
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@dashboard_router.get("/{request_id}")
def get_premium_request_route(
    tenant_id: str,
    request_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    data = get_premium_request_for_tenant(db, tenant_id, request_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Premium request not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@dashboard_router.patch("/{request_id}")
def update_premium_request_route(
    tenant_id: str,
    request_id: str,
    body: UpdatePremiumRequestBody,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    data = update_premium_request_admin(
        db, tenant_id, request_id, body.model_dump(exclude_none=True)
    )
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Premium request not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
