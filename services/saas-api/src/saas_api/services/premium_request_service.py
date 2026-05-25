from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.db.models.end_user import EndUser
from saas_api.db.models.premium_request import PremiumRequest
from saas_api.services.commerce_store import (
    _now,
    create_premium_request_id,
    get_order,
    get_premium_request,
    list_premium_requests_for_tenant as list_premium_tenant_db,
    list_premium_requests_for_user as list_premium_user_db,
    premium_request_to_dict,
    save_premium_request,
    seed_demo_premium_requests,
)
from saas_api.services.product_catalog_service import resolve_premium_product


def list_premium_requests_for_user(db: Session, end_user: EndUser, tenant_id: str) -> list[dict[str, Any]]:
    if tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch", status_code=403)
    return list_premium_user_db(db, tenant_id, end_user.id)


def get_premium_request_for_user(db: Session, end_user: EndUser, request_id: str) -> dict[str, Any]:
    req = get_premium_request(db, request_id)
    if not req or req.tenant_id != end_user.tenant_id or req.end_user_id != end_user.id:
        raise AppError(ApiErrorCode.NOT_FOUND, "Premium request not found", status_code=404)
    return premium_request_to_dict(req)


def create_premium_request(db: Session, end_user: EndUser, body: dict[str, Any]) -> dict[str, Any]:
    tenant_id = body.get("tenantId")
    if tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch", status_code=403)
    if not body.get("consentAccepted"):
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Consent is required", status_code=400)

    product_type = body.get("productType", "premium_consultation")
    if product_type != "premium_consultation":
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Premium requests require premium_consultation product type",
            status_code=400,
        )

    product = resolve_premium_product(db, tenant_id=tenant_id, product_id=body.get("productId"))

    now = _now()
    req_id = create_premium_request_id()
    record = PremiumRequest(
        id=req_id,
        tenant_id=tenant_id,
        end_user_id=end_user.id,
        product_id=product.get("productId") or body.get("productId"),
        product_type="premium_consultation",
        product_title=product["productTitle"],
        status="submitted",
        topic=body.get("topic"),
        personal_question=body.get("personalQuestion"),
        context=body.get("context"),
        contact_method=body.get("contactMethod"),
        contact_value=body.get("contactValue"),
        desired_window=body.get("desiredWindow"),
        consent_accepted=True,
        birth_profile=body.get("birthProfile"),
        created_at=now,
        updated_at=now,
        submitted_at=now,
        timeline=[{"at": now.isoformat().replace("+00:00", "Z"), "status": "submitted", "note": "Заявка отправлена"}],
    )
    save_premium_request(db, record)
    return premium_request_to_dict(record)


def list_premium_requests_for_tenant(
    db: Session, tenant_id: str, params: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    seed_demo_premium_requests(db, tenant_id)
    return list_premium_tenant_db(db, tenant_id, params)


def get_premium_request_for_tenant(
    db: Session, tenant_id: str, request_id: str
) -> dict[str, Any] | None:
    seed_demo_premium_requests(db, tenant_id)
    req = get_premium_request(db, request_id)
    if not req or req.tenant_id != tenant_id:
        return None
    data = premium_request_to_dict(req)
    order_id = req.order_id
    if order_id:
        order = get_order(db, order_id)
        if order:
            data = {
                **data,
                "orderStatus": order.status,
                "paymentStatus": order.payment_status,
            }
    return data


def update_premium_request_admin(
    db: Session, tenant_id: str, request_id: str, body: dict[str, Any]
) -> dict[str, Any] | None:
    req = get_premium_request(db, request_id)
    if not req or req.tenant_id != tenant_id:
        return None
    now = _now()
    timeline = list(req.timeline or [])
    if body.get("status"):
        timeline.append({"at": now.isoformat().replace("+00:00", "Z"), "status": body["status"], "actor": "admin"})
        req.status = body["status"]
    if body.get("assignedExpert") is not None:
        req.assigned_expert = body["assignedExpert"]
    if body.get("finalPdfUrl") is not None:
        req.final_pdf_url = body["finalPdfUrl"]
    if body.get("adminNote"):
        notes = list(req.admin_notes or [])
        notes.append(body["adminNote"])
        req.admin_notes = notes
    req.timeline = timeline
    req.updated_at = now
    save_premium_request(db, req)
    return premium_request_to_dict(req)
