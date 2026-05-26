"""Serialization and query helpers for finance models."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy.orm import Session

from saas_api.db.models.commission import Commission
from saas_api.db.models.ledger_entry import LedgerEntry
from saas_api.db.models.partner_balance import PartnerBalance
from saas_api.db.models.payment import Payment
from saas_api.db.models.payout import Payout
from saas_api.db.models.payout_method import PayoutMethodRecord
from saas_api.services.partner_service import get_partner_name


def _iso(dt: datetime | None) -> str | None:
    if dt is None:
        return None
    return dt.isoformat().replace("+00:00", "Z")


def partner_name(db: Session, tenant_id: str, partner_id: str) -> str | None:
    return get_partner_name(db, tenant_id, partner_id)


def payment_to_dict(payment: Payment, *, include_raw: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": payment.id,
        "tenantId": payment.tenant_id,
        "orderId": payment.order_id,
        "userId": payment.end_user_id,
        "provider": payment.provider,
        "externalPaymentId": payment.external_payment_id,
        "amount": payment.amount,
        "currency": payment.currency,
        "status": payment.status,
        "method": payment.method,
        "providerFee": payment.provider_fee,
        "platformReceivedAmount": payment.platform_received_amount,
        "errorCode": payment.error_code,
        "errorMessage": payment.error_message,
        "createdAt": _iso(payment.created_at),
        "updatedAt": _iso(payment.updated_at),
        "confirmedAt": _iso(payment.confirmed_at),
        "failedAt": _iso(payment.failed_at),
        "refundedAt": _iso(payment.refunded_at),
    }
    if include_raw:
        data["rawProviderPayload"] = payment.raw_provider_payload
    return data


def commission_to_dict(db: Session, commission: Commission) -> dict[str, Any]:
    return {
        "id": commission.id,
        "tenantId": commission.tenant_id,
        "partnerId": commission.partner_id,
        "partnerName": partner_name(db, commission.tenant_id, commission.partner_id),
        "orderId": commission.order_id,
        "paymentId": commission.payment_id,
        "productType": commission.product_type,
        "grossAmount": commission.gross_amount,
        "currency": commission.currency,
        "commissionRate": commission.commission_rate,
        "commissionAmount": commission.commission_amount,
        "status": commission.status,
        "holdUntil": _iso(commission.hold_until),
        "availableAt": _iso(commission.available_at),
        "paidAt": _iso(commission.paid_at),
        "cancelledAt": _iso(commission.cancelled_at),
        "adjustmentReason": commission.adjustment_reason,
        "createdAt": _iso(commission.created_at),
        "updatedAt": _iso(commission.updated_at),
    }


def balance_to_dict(db: Session, balance: PartnerBalance) -> dict[str, Any]:
    return {
        "id": balance.id,
        "tenantId": balance.tenant_id,
        "partnerId": balance.partner_id,
        "partnerName": partner_name(db, balance.tenant_id, balance.partner_id),
        "currency": balance.currency,
        "pendingBalance": balance.pending_balance,
        "availableBalance": balance.available_balance,
        "onHoldBalance": balance.on_hold_balance,
        "paidOutTotal": balance.paid_out_total,
        "adjustedTotal": balance.adjusted_total,
        "refundedTotal": balance.refunded_total,
        "createdAt": _iso(balance.created_at),
        "updatedAt": _iso(balance.updated_at),
    }


def ledger_to_dict(db: Session, entry: LedgerEntry) -> dict[str, Any]:
    return {
        "id": entry.id,
        "tenantId": entry.tenant_id,
        "partnerId": entry.partner_id,
        "partnerName": partner_name(db, entry.tenant_id, entry.partner_id)
        if entry.partner_id
        else None,
        "orderId": entry.order_id,
        "paymentId": entry.payment_id,
        "commissionId": entry.commission_id,
        "payoutId": entry.payout_id,
        "type": entry.type,
        "direction": entry.direction,
        "amount": entry.amount,
        "currency": entry.currency,
        "status": entry.status,
        "description": entry.description,
        "metadata": entry.metadata_json,
        "createdAt": _iso(entry.created_at),
        "createdBy": entry.created_by,
    }


def payout_to_dict(db: Session, payout: Payout) -> dict[str, Any]:
    return {
        "id": payout.id,
        "tenantId": payout.tenant_id,
        "partnerId": payout.partner_id,
        "partnerName": partner_name(db, payout.tenant_id, payout.partner_id),
        "currency": payout.currency,
        "amount": payout.amount,
        "status": payout.status,
        "periodStart": _iso(payout.period_start),
        "periodEnd": _iso(payout.period_end),
        "method": payout.method,
        "provider": payout.provider,
        "externalPayoutId": payout.external_payout_id,
        "failureReason": payout.failure_reason,
        "notes": payout.notes,
        "createdByAdminId": payout.created_by_admin_id,
        "approvedByAdminId": payout.approved_by_admin_id,
        "paidByAdminId": payout.paid_by_admin_id,
        "createdAt": _iso(payout.created_at),
        "updatedAt": _iso(payout.updated_at),
        "approvedAt": _iso(payout.approved_at),
        "paidAt": _iso(payout.paid_at),
        "failedAt": _iso(payout.failed_at),
        "cancelledAt": _iso(payout.cancelled_at),
    }


def payout_method_to_dict(record: PayoutMethodRecord) -> dict[str, Any]:
    return {
        "id": record.id,
        "tenantId": record.tenant_id,
        "partnerId": record.partner_id,
        "type": record.type,
        "status": record.status,
        "displayName": record.display_name,
        "maskedDetails": record.masked_details,
        "adminNote": record.admin_note,
        "createdAt": _iso(record.created_at),
        "verifiedAt": _iso(record.verified_at),
    }


def list_payments_db(
    db: Session,
    tenant_id: str,
    *,
    partner_id: str | None = None,
    status: str | None = None,
    limit: int = 200,
) -> list[dict[str, Any]]:
    from saas_api.db.models.order import Order

    query = db.query(Payment).filter(Payment.tenant_id == tenant_id)
    if status:
        query = query.filter(Payment.status == status)
    if partner_id:
        order_ids = [
            o.id
            for o in db.query(Order.id)
            .filter(Order.tenant_id == tenant_id, Order.partner_id == partner_id)
            .all()
        ]
        if not order_ids:
            return []
        query = query.filter(Payment.order_id.in_(order_ids))
    payments = query.order_by(Payment.created_at.desc()).limit(limit).all()
    return [payment_to_dict(p) for p in payments]


def get_payment_db(db: Session, tenant_id: str, payment_id: str) -> dict[str, Any] | None:
    payment = (
        db.query(Payment)
        .filter(Payment.tenant_id == tenant_id, Payment.id == payment_id)
        .first()
    )
    return payment_to_dict(payment, include_raw=True) if payment else None


def list_commissions_db(
    db: Session,
    tenant_id: str,
    *,
    partner_id: str | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    query = db.query(Commission).filter(Commission.tenant_id == tenant_id)
    if partner_id:
        query = query.filter(Commission.partner_id == partner_id)
    rows = query.order_by(Commission.created_at.desc()).limit(limit).all()
    return [commission_to_dict(db, c) for c in rows]


def commission_summary_from_db(db: Session, tenant_id: str, partner_id: str | None = None) -> dict[str, float]:
    commissions = list_commissions_db(db, tenant_id, partner_id=partner_id, limit=5000)
    summary = {
        "pending": 0.0,
        "available": 0.0,
        "onHold": 0.0,
        "approved": 0.0,
        "paid": 0.0,
        "adjusted": 0.0,
        "cancelled": 0.0,
    }
    for c in commissions:
        status = c["status"]
        amount = c["commissionAmount"]
        if status == "on_hold":
            summary["onHold"] += amount
        elif status in summary:
            summary[status] += amount
    return summary


def list_balances_db(
    db: Session, tenant_id: str, *, partner_id: str | None = None
) -> list[dict[str, Any]]:
    query = db.query(PartnerBalance).filter(PartnerBalance.tenant_id == tenant_id)
    if partner_id:
        query = query.filter(PartnerBalance.partner_id == partner_id)
    return [balance_to_dict(db, b) for b in query.all()]


def list_ledger_db(
    db: Session,
    tenant_id: str,
    *,
    partner_id: str | None = None,
    entry_type: str | None = None,
    currency: str | None = None,
    order_id: str | None = None,
    payment_id: str | None = None,
    payout_id: str | None = None,
    limit: int = 500,
) -> list[dict[str, Any]]:
    query = db.query(LedgerEntry).filter(LedgerEntry.tenant_id == tenant_id)
    if partner_id:
        query = query.filter(LedgerEntry.partner_id == partner_id)
    if entry_type:
        query = query.filter(LedgerEntry.type == entry_type)
    if currency:
        query = query.filter(LedgerEntry.currency == currency)
    if order_id:
        query = query.filter(LedgerEntry.order_id == order_id)
    if payment_id:
        query = query.filter(LedgerEntry.payment_id == payment_id)
    if payout_id:
        query = query.filter(LedgerEntry.payout_id == payout_id)
    rows = query.order_by(LedgerEntry.created_at.desc()).limit(limit).all()
    return [ledger_to_dict(db, e) for e in rows]


def list_payouts_db(
    db: Session, tenant_id: str, *, partner_id: str | None = None
) -> list[dict[str, Any]]:
    query = db.query(Payout).filter(Payout.tenant_id == tenant_id)
    if partner_id:
        query = query.filter(Payout.partner_id == partner_id)
    rows = query.order_by(Payout.created_at.desc()).all()
    return [payout_to_dict(db, p) for p in rows]


def list_payout_methods_db(
    db: Session, tenant_id: str, *, partner_id: str | None = None
) -> list[dict[str, Any]]:
    query = db.query(PayoutMethodRecord).filter(PayoutMethodRecord.tenant_id == tenant_id)
    if partner_id:
        query = query.filter(PayoutMethodRecord.partner_id == partner_id)
    rows = query.order_by(PayoutMethodRecord.created_at.desc()).all()
    return [payout_method_to_dict(r) for r in rows]
