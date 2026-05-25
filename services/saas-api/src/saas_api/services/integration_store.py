"""In-memory checkout/order store for pilot remote SaaS mode."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


@dataclass
class EntitlementRecord:
    id: str
    tenant_id: str
    user_id: str | None
    session_id: str | None
    order_id: str
    product_type: str
    status: str
    report_id: str | None = None
    created_at: str = field(default_factory=_now)
    updated_at: str = field(default_factory=_now)
    granted_at: str | None = None
    revoked_at: str | None = None


@dataclass
class OrderRecord:
    id: str
    tenant_id: str
    user_id: str | None
    session_id: str | None
    product_type: str
    product_title: str
    amount: float
    currency: str
    status: str = "created"
    payment_status: str = "created"
    report_status: str = "locked"
    entitlement_id: str | None = None
    entitlement_status: str | None = None
    external_payment_id: str | None = None
    external_report_id: str | None = None
    payment_url: str | None = None
    theme: str | None = None
    partner_id: str | None = None
    partner_slug: str | None = None
    campaign_id: str | None = None
    created_at: str = field(default_factory=_now)
    paid_at: str | None = None
    last_sync_at: str | None = None
    needs_review: bool = False
    report_error_code: str | None = None
    report_error_message: str | None = None
    admin_notes: str | None = None
    report_progress: int | None = None
    birth_context: dict[str, Any] | None = None


ORDERS: dict[str, OrderRecord] = {}
ENTITLEMENTS: dict[str, EntitlementRecord] = {}
REPORTS: dict[str, dict[str, Any]] = {}
ORDER_NOTES: dict[str, str] = {}
PREMIUM_REQUESTS: dict[str, dict[str, Any]] = {}


def create_order_id() -> str:
    return f"ord_{uuid4().hex[:10]}"


def create_entitlement_id() -> str:
    return f"ent_{uuid4().hex[:10]}"


def order_to_dict(order: OrderRecord) -> dict[str, Any]:
    pdf_url = None
    if order.external_report_id and order.external_report_id in REPORTS:
        pdf_url = REPORTS[order.external_report_id].get("pdfUrl")
    return {
        "id": order.id,
        "tenantId": order.tenant_id,
        "userId": order.user_id,
        "sessionId": order.session_id,
        "productType": order.product_type,
        "productTitle": order.product_title,
        "theme": order.theme,
        "amount": order.amount,
        "currency": order.currency,
        "status": order.status,
        "paymentStatus": order.payment_status,
        "reportStatus": order.report_status,
        "partnerId": order.partner_id,
        "partnerSlug": order.partner_slug,
        "campaignId": order.campaign_id,
        "externalPaymentId": order.external_payment_id,
        "externalReportId": order.external_report_id,
        "entitlementId": order.entitlement_id,
        "entitlementStatus": order.entitlement_status,
        "paymentUrl": order.payment_url,
        "reportErrorCode": order.report_error_code,
        "reportErrorMessage": order.report_error_message,
        "lastSyncAt": order.last_sync_at,
        "needsReview": order.needs_review,
        "reportProgress": order.report_progress,
        "adminNotes": ORDER_NOTES.get(order.id),
        "createdAt": order.created_at,
        "paidAt": order.paid_at,
        "pdfUrl": pdf_url,
    }


def entitlement_to_dict(ent: EntitlementRecord) -> dict[str, Any]:
    pdf_url = None
    if ent.report_id and ent.report_id in REPORTS:
        pdf_url = REPORTS[ent.report_id].get("pdfUrl")
    return {
        "id": ent.id,
        "tenantId": ent.tenant_id,
        "userId": ent.user_id,
        "sessionId": ent.session_id,
        "orderId": ent.order_id,
        "productType": ent.product_type,
        "reportId": ent.report_id,
        "pdfUrl": pdf_url,
        "status": ent.status,
        "grantedAt": ent.granted_at,
        "revokedAt": ent.revoked_at,
        "createdAt": ent.created_at,
        "updatedAt": ent.updated_at,
    }
