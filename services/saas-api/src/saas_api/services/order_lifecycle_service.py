from __future__ import annotations

import asyncio
import logging
from typing import Any

from sqlalchemy.orm import Session

from saas_api.db.models.entitlement import Entitlement
from saas_api.db.models.order import Order
from saas_api.services.astro_client import AstroClientError, get_report_result, get_report_status, request_paid_report
from saas_api.services.commerce_store import (
    _now,
    get_entitlement_for_order,
    get_order,
    get_order_for_tenant,
    log_order_event,
    order_to_dict,
    save_entitlement,
    save_order,
    upsert_paid_report,
)
from saas_api.services.payment_client import PaymentClientError, payment_client
from saas_api.services.finance_service import handle_paid_order_finance, update_payment_status_from_sync
from saas_api.db.session import get_session_factory
from saas_api.settings import settings

logger = logging.getLogger(__name__)


def mock_payment_approval_allowed() -> bool:
    if settings.payment_api_mode == "mock":
        return settings.app_env != "production"
    if settings.app_env == "staging" and settings.allow_staging_mocks:
        return True
    return settings.app_env == "development" and settings.payment_api_mode == "mock"


async def trigger_paid_report(
    db: Session, order: Order, ent: Entitlement | None
) -> str | None:
    if not ent:
        return None
    ctx = order.birth_context or {}
    birth = ctx.get("birth") or {}
    if not birth:
        logger.warning("Paid report skipped: missing birth context for order %s", order.id)
        return None

    payload = {
        "tenantId": order.tenant_id,
        "userId": order.end_user_id,
        "sessionId": order.session_id,
        "orderId": order.id,
        "entitlementId": ent.id,
        "productType": order.product_type,
        "productTitle": order.product_title,
        "theme": order.theme,
        "locale": ctx.get("locale") or "ru",
        "birth": birth,
        "partner": {
            "partnerId": order.partner_id,
            "partnerSlug": order.partner_slug,
            "campaignId": order.campaign_id,
        }
        if order.partner_id or order.partner_slug
        else None,
    }

    try:
        response = request_paid_report(payload)
    except AstroClientError as exc:
        order.report_status = "failed"
        order.report_error_code = str(exc.code)
        order.report_error_message = exc.message
        order.last_sync_at = _now()
        if ent:
            ent.status = "failed"
        save_order(db, order)
        if ent:
            save_entitlement(db, ent)
        return None

    report_id = str(response["reportId"])
    ent.report_id = report_id
    ent.status = "paid_generating"
    order.external_report_id = report_id
    order.report_status = "queued"
    order.entitlement_status = "paid_generating"
    order.last_sync_at = _now()
    save_order(db, order)
    save_entitlement(db, ent)

    asyncio.create_task(_poll_report_until_done(order.id, report_id))
    return report_id


async def _poll_report_until_done(order_id: str, report_id: str, attempt: int = 0) -> None:
    if attempt > 20:
        return
    await asyncio.sleep(0.5)
    session = get_session_factory()()
    try:
        order = get_order(session, order_id)
        ent = get_entitlement_for_order(session, order_id)
        if not order or not ent:
            return

        try:
            status = get_report_status(report_id)
        except AstroClientError:
            return

        order.report_progress = int(status.get("progress") or 0)
        order.last_sync_at = _now()

        if status.get("status") == "ready":
            try:
                report = get_report_result(report_id)
            except AstroClientError as exc:
                order.report_status = "failed"
                order.report_error_code = str(exc.code)
                order.report_error_message = exc.message
                ent.status = "failed"
                save_order(session, order)
                save_entitlement(session, ent)
                return
            upsert_paid_report(
                session,
                report_id=report_id,
                tenant_id=order.tenant_id,
                end_user_id=order.end_user_id,
                order_id=order.id,
                entitlement_id=ent.id,
                product_type=order.product_type,
                theme=order.theme,
                report_json=report,
                locale=str((order.birth_context or {}).get("locale") or "ru"),
            )
            ent.status = "ready"
            ent.report_id = report_id
            order.report_status = "ready"
            order.entitlement_status = "ready"
            order.report_error_code = None
            order.report_error_message = None
            save_order(session, order)
            save_entitlement(session, ent)
            return

        if status.get("status") == "failed":
            order.report_status = "failed"
            order.report_error_code = status.get("errorCode")
            order.report_error_message = status.get("errorMessage")
            ent.status = "failed"
            save_order(session, order)
            save_entitlement(session, ent)
            return

        order.report_status = "generating"
        save_order(session, order)
    finally:
        session.close()

    await _poll_report_until_done(order_id, report_id, attempt + 1)


async def apply_paid_transition(
    db: Session,
    order: Order,
    payment_status: dict[str, Any],
    ent: Entitlement | None,
    *,
    actor_account_id: str | None = None,
) -> str | None:
    """Apply paid order transition: order status, finance posting, report trigger."""
    already_paid = order.status == "paid"
    paid_at = order.paid_at or _now()

    if not already_paid:
        order.status = "paid"
        order.payment_status = "paid"
        order.paid_at = paid_at
        order.entitlement_status = "paid_generating"
        order.last_sync_at = paid_at
        if ent:
            ent.status = "paid_generating"
            ent.granted_at = paid_at
        save_order(db, order)
        if ent:
            save_entitlement(db, ent)

    handle_paid_order_finance(
        db, order, payment_status, actor_account_id=actor_account_id
    )

    external_report_id = order.external_report_id
    if not external_report_id:
        external_report_id = await trigger_paid_report(db, order, ent)
    return external_report_id


async def sync_order_payment(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    if not order.external_payment_id:
        return order_to_dict(order)

    try:
        payment_status = await payment_client.sync_payment_status(order_id)
    except PaymentClientError:
        payment_status = await payment_client.get_payment_status(order.external_payment_id)

    order.last_sync_at = _now()
    ent = get_entitlement_for_order(db, order_id)

    if payment_status["status"] == "paid":
        await apply_paid_transition(
            db, order, payment_status, ent, actor_account_id=None
        )
    elif payment_status["status"] in {"failed", "cancelled", "expired"}:
        update_payment_status_from_sync(db, order, payment_status)
        order.status = payment_status["status"]
        order.payment_status = payment_status["status"]
        if ent:
            ent.status = "locked"
        save_order(db, order)
        if ent:
            save_entitlement(db, ent)

    return order_to_dict(order)


async def approve_mock_payment(
    db: Session,
    tenant_id: str,
    order_id: str,
    *,
    actor_account_id: str | None = None,
) -> dict[str, Any] | None:
    if not mock_payment_approval_allowed():
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(
            ApiErrorCode.FORBIDDEN,
            "Mock payment approval is not allowed in this environment",
            status_code=403,
        )

    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order or not order.external_payment_id:
        return None

    payment_client.mock_mark_paid(order.external_payment_id)
    log_order_event(
        db,
        tenant_id=tenant_id,
        entity_type="order",
        entity_id=order_id,
        event_type="mock_payment_approved",
        payload={"paymentId": order.external_payment_id},
        actor_account_id=actor_account_id,
    )
    return await sync_order_payment(db, tenant_id, order_id)


async def sync_order_report(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order or not order.external_report_id:
        return order_to_dict(order) if order else None

    ent = get_entitlement_for_order(db, order_id)
    try:
        status = get_report_status(order.external_report_id)
    except AstroClientError as exc:
        order.report_error_code = str(exc.code)
        order.report_error_message = exc.message
        order.last_sync_at = _now()
        save_order(db, order)
        return order_to_dict(order)

    order.report_progress = int(status.get("progress") or 0)
    order.last_sync_at = _now()

    if status.get("status") == "ready":
        try:
            report = get_report_result(order.external_report_id)
            upsert_paid_report(
                db,
                report_id=order.external_report_id,
                tenant_id=order.tenant_id,
                end_user_id=order.end_user_id,
                order_id=order.id,
                entitlement_id=ent.id if ent else order.entitlement_id or "",
                product_type=order.product_type,
                theme=order.theme,
                report_json=report,
                locale=str((order.birth_context or {}).get("locale") or "ru"),
            )
            order.report_status = "ready"
            order.entitlement_status = "ready"
            if ent:
                ent.status = "ready"
                save_entitlement(db, ent)
        except AstroClientError as exc:
            order.report_status = "failed"
            order.report_error_code = str(exc.code)
            order.report_error_message = exc.message
            if ent:
                ent.status = "failed"
                save_entitlement(db, ent)
    elif status.get("status") == "failed":
        order.report_status = "failed"
        order.report_error_code = status.get("errorCode")
        order.report_error_message = status.get("errorMessage")
        if ent:
            ent.status = "failed"
            save_entitlement(db, ent)
    else:
        order.report_status = "generating"

    save_order(db, order)
    return order_to_dict(order)


async def retry_order_report(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    if order.status != "paid":
        return order_to_dict(order)

    ent = get_entitlement_for_order(db, order_id)
    order.report_status = "queued"
    order.report_error_code = None
    order.report_error_message = None
    order.last_sync_at = _now()
    if ent:
        ent.status = "paid_generating"
        save_entitlement(db, ent)
    save_order(db, order)

    await trigger_paid_report(db, order, ent)
    return order_to_dict(order)


def set_order_needs_review(
    db: Session, tenant_id: str, order_id: str, needs_review: bool = True
) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    order.needs_review = needs_review
    order.last_sync_at = _now()
    save_order(db, order)
    return order_to_dict(order)


def revoke_entitlement(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    ent = get_entitlement_for_order(db, order_id)
    if ent:
        ent.status = "revoked"
        ent.revoked_at = _now()
        save_entitlement(db, ent)
        order.entitlement_status = "revoked"
    order.last_sync_at = _now()
    save_order(db, order)
    return order_to_dict(order)


def unlock_entitlement(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    ent = get_entitlement_for_order(db, order_id)
    if ent and order.report_status == "ready":
        ent.status = "ready"
        ent.revoked_at = None
        save_entitlement(db, ent)
        order.entitlement_status = "ready"
    order.last_sync_at = _now()
    save_order(db, order)
    return order_to_dict(order)


def list_orders_for_tenant(
    db: Session, tenant_id: str, params: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    from saas_api.services.commerce_store import list_orders_for_tenant as list_orders_db

    return list_orders_db(db, tenant_id, params)


def get_order_for_tenant_dict(db: Session, tenant_id: str, order_id: str) -> dict[str, Any] | None:
    order = get_order_for_tenant(db, tenant_id, order_id)
    if not order:
        return None
    from saas_api.services.commerce_store import _pdf_url_for_report

    return order_to_dict(order, pdf_url=_pdf_url_for_report(db, order.external_report_id))


def compute_revenue_summary(db: Session, tenant_id: str) -> dict[str, Any]:
    orders = (
        db.query(Order)
        .filter(Order.tenant_id == tenant_id, Order.status == "paid", Order.amount > 0)
        .all()
    )
    total = sum(order.amount for order in orders)
    by_product: dict[str, dict[str, Any]] = {}
    for order in orders:
        label = order.product_title
        bucket = by_product.setdefault(label, {"label": label, "orderCount": 0, "revenue": 0.0})
        bucket["orderCount"] += 1
        bucket["revenue"] += order.amount
    return {
        "revenueToday": 0.0,
        "revenueLast7Days": total,
        "revenueLast30Days": total,
        "paidOrdersCount": len(orders),
        "averageOrderValue": total / len(orders) if orders else 0.0,
        "refundsAmount": 0.0,
        "refundsCount": 0,
        "byProduct": list(by_product.values()),
        "byTheme": [],
        "byPartner": [],
    }
