from __future__ import annotations

from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError

from saas_api.db.models.end_user import EndUser
from saas_api.db.models.entitlement import Entitlement
from saas_api.db.models.order import Order
from saas_api.services.commerce_store import (
    _now,
    create_entitlement_id,
    create_order_id,
    entitlement_to_dict,
    find_entitlement_for_report,
    get_entitlement,
    get_entitlement_for_order,
    get_order,
    list_entitlements_for_user as list_entitlements_db,
    order_to_dict,
    save_entitlement,
    save_order,
)
from saas_api.services.order_lifecycle_service import apply_paid_transition, trigger_paid_report
from saas_api.services.payment_client import PaymentClientError, payment_client
from saas_api.services.product_catalog_service import resolve_checkout_product
from saas_api.settings import settings


def _build_return_urls(tenant_slug: str) -> dict[str, str]:
    base = settings.miniapp_public_base_url.rstrip("/")
    prefix = f"{base}/{tenant_slug}"
    return {
        "successUrl": f"{prefix}/payment/success",
        "cancelUrl": f"{prefix}/payment/cancel",
        "pendingUrl": f"{prefix}/payment/pending",
    }


def _assert_order_owner(order: Order, end_user: EndUser) -> None:
    if order.end_user_id != end_user.id or order.tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Order not found", status_code=404)


async def start_checkout(db: Session, end_user: EndUser, payload: dict[str, Any]) -> dict[str, Any]:
    tenant_id = str(payload.get("tenantId") or end_user.tenant_id)
    if tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch", status_code=403)

    product = resolve_checkout_product(
        db,
        tenant_id=tenant_id,
        product_id=str(payload.get("productId") or ""),
        product_type=payload.get("productType"),
    )

    tenant_slug = str(payload.get("tenantSlug") or tenant_id)
    order_id = create_order_id()
    entitlement_id = create_entitlement_id()
    now = _now()
    urls = _build_return_urls(tenant_slug)
    partner = payload.get("partner") or {}

    order = Order(
        id=order_id,
        tenant_id=tenant_id,
        end_user_id=end_user.id,
        session_id=end_user.id,
        product_id=product["productId"],
        product_type=product["productType"],
        product_title=product["productTitle"],
        amount=float(product["amount"]),
        currency=str(product["currency"]),
        theme=product.get("theme") or payload.get("theme"),
        partner_id=partner.get("partnerId"),
        partner_slug=partner.get("partnerSlug"),
        campaign_id=partner.get("campaignId"),
        status="payment_pending",
        payment_status="payment_pending",
        entitlement_id=entitlement_id,
        entitlement_status="pending_payment",
        birth_context={"birth": payload.get("birth"), "locale": payload.get("locale")},
        created_at=now,
        updated_at=now,
    )
    ent = Entitlement(
        id=entitlement_id,
        tenant_id=tenant_id,
        end_user_id=end_user.id,
        session_id=end_user.id,
        order_id=order_id,
        product_type=order.product_type,
        status="pending_payment",
        created_at=now,
        updated_at=now,
    )

    try:
        payment = await payment_client.create_payment(
            {
                "orderId": order_id,
                "tenantId": tenant_id,
                "tenantSlug": tenant_slug,
                "userId": end_user.id,
                "sessionId": end_user.id,
                "productType": order.product_type,
                "productTitle": order.product_title,
                "amount": order.amount,
                "currency": order.currency,
                "successUrl": urls["successUrl"],
                "cancelUrl": urls["cancelUrl"],
                "pendingUrl": urls["pendingUrl"],
                "metadata": {
                    "partnerId": order.partner_id,
                    "partnerSlug": order.partner_slug,
                    "campaignId": order.campaign_id,
                    "theme": order.theme,
                    "locale": payload.get("locale"),
                },
            }
        )
    except PaymentClientError as exc:
        raise AppError(exc.code, exc.message, status_code=502) from exc

    order.external_payment_id = payment["paymentId"]
    order.payment_url = payment["paymentUrl"]
    order.last_sync_at = now
    save_order(db, order)
    save_entitlement(db, ent)

    return {
        "orderId": order_id,
        "paymentId": payment["paymentId"],
        "paymentUrl": payment["paymentUrl"],
        "status": "payment_pending",
        "entitlementId": entitlement_id,
    }


def get_checkout_order(db: Session, end_user: EndUser, order_id: str) -> dict[str, Any]:
    order = get_order(db, order_id)
    if not order:
        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    _assert_order_owner(order, end_user)
    return {
        "orderId": order.id,
        "orderStatus": order.status,
        "paymentStatus": order.payment_status,
        "paymentUrl": order.payment_url,
        "externalPaymentId": order.external_payment_id,
        "entitlementId": order.entitlement_id,
        "entitlementStatus": order.entitlement_status,
        "reportStatus": order.report_status,
        "externalReportId": order.external_report_id,
    }


async def confirm_payment_return(
    db: Session,
    end_user: EndUser,
    order_id: str,
    return_state: str,
) -> dict[str, Any]:
    order = get_order(db, order_id)
    if not order:
        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    _assert_order_owner(order, end_user)
    ent = get_entitlement_for_order(db, order_id)

    if return_state in {"cancel", "failed"}:
        order.status = "cancelled" if return_state == "cancel" else "failed"
        order.payment_status = order.status
        order.last_sync_at = _now()
        if ent:
            ent.status = "locked"
        save_order(db, order)
        if ent:
            save_entitlement(db, ent)
        return {
            "orderId": order_id,
            "orderStatus": order.status,
            "paymentStatus": order.payment_status,
            "entitlementStatus": "locked",
            "message": "Payment was not completed.",
        }

    if return_state == "pending":
        return {
            "orderId": order_id,
            "orderStatus": order.status,
            "paymentStatus": order.payment_status,
            "entitlementStatus": order.entitlement_status,
            "reportStatus": order.report_status,
            "message": "Waiting for payment confirmation.",
        }

    if not order.external_payment_id:
        raise AppError("payment_status_failed", "Order has no external payment id", status_code=400)

    try:
        payment_status = await payment_client.get_payment_status(order.external_payment_id)
    except PaymentClientError as exc:
        raise AppError(exc.code, exc.message, status_code=502) from exc

    if payment_status["status"] != "paid":
        return {
            "orderId": order_id,
            "orderStatus": order.status,
            "paymentStatus": order.payment_status,
            "entitlementStatus": order.entitlement_status or "pending_payment",
            "reportStatus": order.report_status,
            "message": "Waiting for payment confirmation.",
        }

    order.report_status = "queued"
    external_report_id = await apply_paid_transition(
        db, order, payment_status, ent, actor_account_id=None
    )

    return {
        "orderId": order_id,
        "orderStatus": "paid",
        "paymentStatus": "paid",
        "entitlementStatus": "paid_generating",
        "reportStatus": order.report_status,
        "externalReportId": external_report_id,
        "message": "Payment received. Report generation started.",
    }


def list_entitlements_for_user(db: Session, end_user: EndUser, tenant_id: str) -> list[dict[str, Any]]:
    if tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch", status_code=403)
    return list_entitlements_db(db, tenant_id, end_user.id)


def check_report_access(
    db: Session, end_user: EndUser, tenant_id: str, report_id: str
) -> dict[str, Any]:
    if tenant_id != end_user.tenant_id:
        raise AppError(ApiErrorCode.FORBIDDEN, "Tenant mismatch", status_code=403)

    ent = find_entitlement_for_report(
        db, tenant_id=tenant_id, end_user_id=end_user.id, report_id=report_id
    )
    if not ent:
        return {
            "allowed": False,
            "entitlementStatus": None,
            "reportStatus": None,
            "reason": "Report not found or not owned by session.",
        }

    if ent.status == "revoked":
        return {
            "allowed": False,
            "entitlementStatus": ent.status,
            "reportStatus": "locked",
            "reason": "Entitlement has been revoked.",
        }
    if ent.status != "ready":
        return {
            "allowed": False,
            "entitlementStatus": ent.status,
            "reportStatus": "generating",
            "reason": "Report is not ready yet.",
        }

    order = get_order(db, ent.order_id)
    report_status = order.report_status if order else "ready"
    if report_status not in {"ready", "completed"}:
        return {
            "allowed": False,
            "entitlementStatus": ent.status,
            "reportStatus": report_status,
            "reason": "Report is not ready yet.",
        }
    return {
        "allowed": True,
        "entitlementStatus": ent.status,
        "reportStatus": "ready",
        "reason": None,
    }
