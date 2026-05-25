from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.end_user_dependencies import get_current_end_user
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from saas_api.schemas.integration import ConfirmPaymentReturnRequest, StartCheckoutRequest
from saas_api.services.audit_service import log_action
from saas_api.services.checkout_service import (
    check_report_access,
    confirm_payment_return,
    get_checkout_order,
    list_entitlements_for_user,
    start_checkout,
)

router = APIRouter(prefix="/api/checkout", tags=["checkout"])
entitlements_router = APIRouter(prefix="/api/me", tags=["entitlements"])


@router.post("/start")
async def start_checkout_route(
    body: StartCheckoutRequest,
    request: Request,
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = await start_checkout(db, end_user, body.model_dump(by_alias=True))
    log_action(
        db,
        action="checkout.created",
        actor_account_id=None,
        tenant_id=body.tenant_id,
        payload={"orderId": data.get("orderId"), "productId": body.product_id},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/{order_id}")
async def get_checkout_order_route(
    order_id: str,
    request: Request,
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = get_checkout_order(db, end_user, order_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/{order_id}/confirm-return")
async def confirm_payment_return_route(
    order_id: str,
    body: ConfirmPaymentReturnRequest,
    request: Request,
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = await confirm_payment_return(db, end_user, order_id, body.return_state)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@entitlements_router.get("/entitlements")
async def list_entitlements_route(
    request: Request,
    tenantId: str = Query(...),
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = list_entitlements_for_user(db, end_user, tenantId)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@entitlements_router.get("/reports/{report_id}/access")
async def report_access_route(
    report_id: str,
    request: Request,
    tenantId: str = Query(...),
    db: Session = Depends(get_db),
    end_user: EndUser = Depends(get_current_end_user),
) -> dict:
    data = check_report_access(db, end_user, tenantId, report_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))
