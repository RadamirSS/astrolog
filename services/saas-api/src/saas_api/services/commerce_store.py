"""PostgreSQL persistence for orders, entitlements, premium requests, and paid reports."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from sqlalchemy.orm import Session

from saas_api.auth.passwords import new_id
from saas_api.db.models.entitlement import Entitlement
from saas_api.db.models.order import Order
from saas_api.db.models.order_event import OrderEvent
from saas_api.db.models.premium_request import PremiumRequest
from saas_api.db.models.report import Report, ReportStatus


def _now() -> datetime:
    return datetime.now(UTC)


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.isoformat().replace("+00:00", "Z")


def create_order_id() -> str:
    return f"ord_{uuid4().hex[:10]}"


def create_entitlement_id() -> str:
    return f"ent_{uuid4().hex[:10]}"


def create_premium_request_id() -> str:
    return f"pr_{uuid4().hex[:10]}"


def order_to_dict(order: Order, *, pdf_url: str | None = None) -> dict[str, Any]:
    return {
        "id": order.id,
        "tenantId": order.tenant_id,
        "userId": order.end_user_id,
        "sessionId": order.session_id,
        "productId": order.product_id,
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
        "lastSyncAt": _iso(order.last_sync_at),
        "needsReview": order.needs_review,
        "reportProgress": order.report_progress,
        "adminNotes": order.admin_notes,
        "createdAt": _iso(order.created_at),
        "paidAt": _iso(order.paid_at),
        "pdfUrl": pdf_url,
    }


def entitlement_to_dict(ent: Entitlement, *, pdf_url: str | None = None) -> dict[str, Any]:
    return {
        "id": ent.id,
        "tenantId": ent.tenant_id,
        "userId": ent.end_user_id,
        "sessionId": ent.session_id,
        "orderId": ent.order_id,
        "productType": ent.product_type,
        "reportId": ent.report_id,
        "pdfUrl": pdf_url,
        "status": ent.status,
        "grantedAt": _iso(ent.granted_at),
        "revokedAt": _iso(ent.revoked_at),
        "createdAt": _iso(ent.created_at),
        "updatedAt": _iso(ent.updated_at),
    }


def premium_request_to_dict(req: PremiumRequest) -> dict[str, Any]:
    return {
        "id": req.id,
        "tenantId": req.tenant_id,
        "userId": req.end_user_id,
        "sessionId": req.session_id,
        "orderId": req.order_id,
        "productId": req.product_id,
        "productType": req.product_type,
        "productTitle": req.product_title,
        "status": req.status,
        "topic": req.topic,
        "personalQuestion": req.personal_question,
        "context": req.context,
        "contactMethod": req.contact_method,
        "contactValue": req.contact_value,
        "desiredWindow": req.desired_window,
        "consentAccepted": req.consent_accepted,
        "birthProfile": req.birth_profile,
        "assignedExpert": req.assigned_expert,
        "adminNotes": req.admin_notes,
        "finalPdfUrl": req.final_pdf_url,
        "timeline": req.timeline,
        "createdAt": _iso(req.created_at),
        "updatedAt": _iso(req.updated_at),
        "submittedAt": _iso(req.submitted_at),
    }


def _pdf_url_for_report(db: Session, report_id: str | None) -> str | None:
    if not report_id:
        return None
    report = db.get(Report, report_id)
    if report:
        if report.pdf_url:
            return report.pdf_url
        if report.report_json and isinstance(report.report_json, dict):
            return report.report_json.get("pdfUrl")
    return None


def get_order(db: Session, order_id: str) -> Order | None:
    return db.get(Order, order_id)


def get_order_for_tenant(db: Session, tenant_id: str, order_id: str) -> Order | None:
    order = db.get(Order, order_id)
    if not order or order.tenant_id != tenant_id:
        return None
    return order


def get_entitlement(db: Session, entitlement_id: str) -> Entitlement | None:
    return db.get(Entitlement, entitlement_id)


def get_entitlement_for_order(db: Session, order_id: str) -> Entitlement | None:
    return (
        db.query(Entitlement).filter(Entitlement.order_id == order_id).first()
    )


def list_orders_for_tenant(db: Session, tenant_id: str, params: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    params = params or {}
    query = db.query(Order).filter(Order.tenant_id == tenant_id)
    if params.get("status"):
        query = query.filter(Order.status == params["status"])
    if params.get("productType"):
        query = query.filter(Order.product_type == params["productType"])
    if params.get("partnerId"):
        query = query.filter(Order.partner_id == params["partnerId"])
    orders = query.order_by(Order.created_at.desc()).all()
    return [
        order_to_dict(order, pdf_url=_pdf_url_for_report(db, order.external_report_id))
        for order in orders
    ]


def list_entitlements_for_user(db: Session, tenant_id: str, end_user_id: str) -> list[dict[str, Any]]:
    ents = (
        db.query(Entitlement)
        .filter(Entitlement.tenant_id == tenant_id, Entitlement.end_user_id == end_user_id)
        .all()
    )
    return [
        entitlement_to_dict(ent, pdf_url=_pdf_url_for_report(db, ent.report_id))
        for ent in ents
    ]


def find_entitlement_for_report(
    db: Session, *, tenant_id: str, end_user_id: str, report_id: str
) -> Entitlement | None:
    return (
        db.query(Entitlement)
        .filter(
            Entitlement.tenant_id == tenant_id,
            Entitlement.end_user_id == end_user_id,
            Entitlement.report_id == report_id,
        )
        .first()
    )


def save_order(db: Session, order: Order) -> Order:
    order.updated_at = _now()
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


def save_entitlement(db: Session, ent: Entitlement) -> Entitlement:
    ent.updated_at = _now()
    db.add(ent)
    db.commit()
    db.refresh(ent)
    return ent


def save_premium_request(db: Session, req: PremiumRequest) -> PremiumRequest:
    req.updated_at = _now()
    db.add(req)
    db.commit()
    db.refresh(req)
    return req


def log_order_event(
    db: Session,
    *,
    tenant_id: str,
    entity_type: str,
    entity_id: str,
    event_type: str,
    payload: dict[str, Any] | None = None,
    actor_account_id: str | None = None,
) -> None:
    db.add(
        OrderEvent(
            id=new_id("oev"),
            tenant_id=tenant_id,
            entity_type=entity_type,
            entity_id=entity_id,
            event_type=event_type,
            payload_json=payload,
            actor_account_id=actor_account_id,
            created_at=_now(),
        )
    )
    db.commit()


def upsert_paid_report(
    db: Session,
    *,
    report_id: str,
    tenant_id: str,
    end_user_id: str,
    order_id: str,
    entitlement_id: str,
    product_type: str,
    theme: str | None,
    report_json: dict[str, Any],
    locale: str = "ru",
) -> Report:
    report = db.get(Report, report_id)
    pdf_url = report_json.get("pdfUrl") if isinstance(report_json, dict) else None
    now = _now()
    if report:
        report.status = ReportStatus.COMPLETED
        report.report_json = report_json
        report.completed_at = now
        report.updated_at = now
        report.pdf_url = pdf_url
    else:
        report = Report(
            id=report_id,
            tenant_id=tenant_id,
            end_user_id=end_user_id,
            order_id=order_id,
            entitlement_id=entitlement_id,
            product_type=product_type,
            theme=theme,
            report_type="paid",
            status=ReportStatus.COMPLETED,
            locale=locale,
            request_json={"orderId": order_id, "entitlementId": entitlement_id},
            report_json=report_json,
            pdf_url=pdf_url,
            created_at=now,
            updated_at=now,
            completed_at=now,
        )
        db.add(report)
    db.commit()
    db.refresh(report)
    return report


def get_paid_report_json(db: Session, report_id: str) -> dict[str, Any] | None:
    report = db.get(Report, report_id)
    if report and report.report_json:
        return report.report_json
    return None


def list_premium_requests_for_user(db: Session, tenant_id: str, end_user_id: str) -> list[dict[str, Any]]:
    reqs = (
        db.query(PremiumRequest)
        .filter(PremiumRequest.tenant_id == tenant_id, PremiumRequest.end_user_id == end_user_id)
        .order_by(PremiumRequest.updated_at.desc())
        .all()
    )
    return [premium_request_to_dict(r) for r in reqs]


def get_premium_request(db: Session, request_id: str) -> PremiumRequest | None:
    return db.get(PremiumRequest, request_id)


def list_premium_requests_for_tenant(
    db: Session, tenant_id: str, params: dict[str, Any] | None = None
) -> list[dict[str, Any]]:
    params = params or {}
    query = db.query(PremiumRequest).filter(PremiumRequest.tenant_id == tenant_id)
    if params.get("status"):
        query = query.filter(PremiumRequest.status == params["status"])
    if params.get("topic"):
        query = query.filter(PremiumRequest.topic == params["topic"])
    reqs = query.order_by(PremiumRequest.updated_at.desc()).all()
    return [premium_request_to_dict(r) for r in reqs]


def seed_demo_premium_requests(db: Session, tenant_id: str) -> None:
    existing = (
        db.query(PremiumRequest)
        .filter(PremiumRequest.tenant_id == tenant_id, PremiumRequest.id.like("pr_%_seed"))
        .count()
    )
    if existing:
        return
    from datetime import timedelta

    def days_ago(days: int) -> datetime:
        return _now() - timedelta(days=days)

    seeds = [
        PremiumRequest(
            id="pr_submitted_seed",
            tenant_id=tenant_id,
            end_user_id=None,
            product_type="premium_consultation",
            product_title="Premium-разбор",
            status="submitted",
            topic="relationships",
            personal_question="Как улучшить доверие в паре?",
            consent_accepted=True,
            created_at=days_ago(2),
            updated_at=days_ago(2),
            submitted_at=days_ago(2),
            timeline=[{"at": _iso(days_ago(2)), "status": "submitted", "note": "Заявка отправлена"}],
        ),
        PremiumRequest(
            id="pr_in_review_seed",
            tenant_id=tenant_id,
            end_user_id=None,
            session_id="sess_seed",
            product_type="premium_consultation",
            product_title="Premium-разбор",
            status="in_review",
            topic="money",
            personal_question="Финансовая стратегия.",
            consent_accepted=True,
            assigned_expert="Эксперт (пилот)",
            admin_notes=["Проверить данные"],
            created_at=days_ago(5),
            updated_at=days_ago(1),
            submitted_at=days_ago(5),
            timeline=[{"at": _iso(days_ago(5)), "status": "submitted", "note": "Заявка отправлена"}],
        ),
    ]
    for item in seeds:
        db.add(item)
    db.commit()
