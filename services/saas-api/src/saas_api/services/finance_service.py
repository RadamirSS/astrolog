"""Finance lifecycle: payments, commissions, ledger, balances, payouts."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.commission import Commission, CommissionStatus
from saas_api.db.models.ledger_entry import (
    LedgerDirection,
    LedgerEntry,
    LedgerEntryStatus,
    LedgerEntryType,
)
from saas_api.db.models.order import Order
from saas_api.db.models.partner_balance import PartnerBalance
from saas_api.db.models.payment import Payment, PaymentStatus
from saas_api.db.models.payout import Payout, PayoutMethodType, PayoutStatus
from saas_api.services import ops_seed_service
from saas_api.services.commerce_store import _now, log_order_event, save_order
from saas_api.services.finance_store import (
    balance_to_dict,
    commission_to_dict,
    ledger_to_dict,
    payment_to_dict,
    payout_to_dict,
)
from saas_api.settings import settings


def _round_money(value: float) -> float:
    return round(value, 2)


def _resolve_commission_rate(tenant_id: str, partner_id: str, product_type: str) -> float:
    partner = ops_seed_service.get_partner(tenant_id, partner_id)
    if not partner:
        return 0.0
    overrides = partner.get("productCommissionRates") or {}
    if product_type in overrides:
        return float(overrides[product_type])
    return float(partner.get("commissionRate") or 0.0)


def get_or_create_partner_balance(
    db: Session, tenant_id: str, partner_id: str, currency: str
) -> PartnerBalance:
    balance = (
        db.query(PartnerBalance)
        .filter(
            PartnerBalance.tenant_id == tenant_id,
            PartnerBalance.partner_id == partner_id,
            PartnerBalance.currency == currency,
        )
        .first()
    )
    if balance:
        return balance
    now = _now()
    balance = PartnerBalance(
        id=new_id("bal"),
        tenant_id=tenant_id,
        partner_id=partner_id,
        currency=currency,
        pending_balance=0.0,
        available_balance=0.0,
        on_hold_balance=0.0,
        paid_out_total=0.0,
        adjusted_total=0.0,
        refunded_total=0.0,
        created_at=now,
        updated_at=now,
    )
    db.add(balance)
    db.flush()
    return balance


def post_ledger_entry(
    db: Session,
    *,
    tenant_id: str,
    entry_type: str,
    direction: str,
    amount: float,
    currency: str,
    description: str,
    partner_id: str | None = None,
    order_id: str | None = None,
    payment_id: str | None = None,
    commission_id: str | None = None,
    payout_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    created_by: str | None = None,
    status: str = LedgerEntryStatus.POSTED,
) -> LedgerEntry:
    entry = LedgerEntry(
        id=new_id("led"),
        tenant_id=tenant_id,
        partner_id=partner_id,
        order_id=order_id,
        payment_id=payment_id,
        commission_id=commission_id,
        payout_id=payout_id,
        type=entry_type,
        direction=direction,
        amount=_round_money(amount),
        currency=currency,
        status=status,
        description=description,
        metadata_json=metadata,
        created_at=_now(),
        created_by=created_by,
    )
    db.add(entry)
    db.flush()
    return entry


def record_payment_confirmed(
    db: Session,
    order: Order,
    payment_status: dict[str, Any],
    *,
    actor_account_id: str | None = None,
) -> Payment | None:
    """Create or update Payment record when external payment is confirmed paid."""
    external_id = order.external_payment_id or payment_status.get("paymentId")
    if not external_id:
        return None

    existing = (
        db.query(Payment)
        .filter(Payment.tenant_id == order.tenant_id, Payment.external_payment_id == external_id)
        .first()
    )

    pay_amount = float(payment_status.get("amount") or order.amount)
    pay_currency = str(payment_status.get("currency") or order.currency)
    provider = str(payment_status.get("provider") or "mock")
    provider_fee = payment_status.get("providerFee")
    if provider_fee is not None:
        provider_fee = float(provider_fee)

    status = str(payment_status.get("status") or PaymentStatus.PAID)
    now = _now()

    if existing and existing.status == PaymentStatus.PAID:
        return existing

    if existing:
        payment = existing
        payment.status = status
        payment.updated_at = now
        if status == PaymentStatus.PAID:
            payment.confirmed_at = payment.confirmed_at or now
    else:
        payment = Payment(
            id=new_id("pay"),
            tenant_id=order.tenant_id,
            order_id=order.id,
            end_user_id=order.end_user_id,
            provider=provider,
            external_payment_id=external_id,
            amount=pay_amount,
            currency=pay_currency,
            status=status,
            method=payment_status.get("method"),
            provider_fee=provider_fee,
            platform_received_amount=_round_money(pay_amount - (provider_fee or 0)),
            raw_provider_payload=payment_status.get("raw") or payment_status,
            created_at=now,
            updated_at=now,
            confirmed_at=now if status == PaymentStatus.PAID else None,
        )
        db.add(payment)
        db.flush()

    if pay_amount != order.amount or pay_currency != order.currency:
        order.needs_review = True
        save_order(db, order)

    if status == PaymentStatus.PAID:
        payment.confirmed_at = payment.confirmed_at or now
        post_ledger_entry(
            db,
            tenant_id=order.tenant_id,
            entry_type=LedgerEntryType.PAYMENT_RECEIVED,
            direction=LedgerDirection.CREDIT,
            amount=pay_amount,
            currency=pay_currency,
            description=f"Payment received for order {order.id}",
            order_id=order.id,
            payment_id=payment.id,
            created_by=actor_account_id,
        )
        if provider_fee and provider_fee > 0:
            post_ledger_entry(
                db,
                tenant_id=order.tenant_id,
                entry_type=LedgerEntryType.PROVIDER_FEE,
                direction=LedgerDirection.DEBIT,
                amount=provider_fee,
                currency=pay_currency,
                description=f"Provider fee for order {order.id}",
                order_id=order.id,
                payment_id=payment.id,
                created_by=actor_account_id,
            )
        platform_net = _round_money(pay_amount - (provider_fee or 0))
        post_ledger_entry(
            db,
            tenant_id=order.tenant_id,
            entry_type=LedgerEntryType.PLATFORM_REVENUE,
            direction=LedgerDirection.CREDIT,
            amount=platform_net,
            currency=pay_currency,
            description=f"Platform revenue for order {order.id}",
            order_id=order.id,
            payment_id=payment.id,
            created_by=actor_account_id,
        )
        create_commission_for_paid_order(db, order, payment, actor_account_id=actor_account_id)

    db.flush()
    return payment


def create_commission_for_paid_order(
    db: Session,
    order: Order,
    payment: Payment,
    *,
    actor_account_id: str | None = None,
) -> Commission | None:
    if not order.partner_id or order.amount <= 0:
        return None

    existing = db.query(Commission).filter(Commission.order_id == order.id).first()
    if existing:
        return existing

    rate = _resolve_commission_rate(order.tenant_id, order.partner_id, order.product_type)
    commission_amount = _round_money(order.amount * rate)
    now = _now()
    hold_until = now + timedelta(days=settings.commission_hold_days)

    commission = Commission(
        id=new_id("comm"),
        tenant_id=order.tenant_id,
        partner_id=order.partner_id,
        order_id=order.id,
        payment_id=payment.id,
        product_type=order.product_type,
        gross_amount=order.amount,
        currency=order.currency,
        commission_rate=rate,
        commission_amount=commission_amount,
        status=CommissionStatus.PENDING,
        hold_until=hold_until,
        created_at=now,
        updated_at=now,
    )
    db.add(commission)
    db.flush()

    balance = get_or_create_partner_balance(
        db, order.tenant_id, order.partner_id, order.currency
    )
    balance.pending_balance = _round_money(balance.pending_balance + commission_amount)
    balance.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=order.tenant_id,
        partner_id=order.partner_id,
        entry_type=LedgerEntryType.PARTNER_COMMISSION_PENDING,
        direction=LedgerDirection.CREDIT,
        amount=commission_amount,
        currency=order.currency,
        description=f"Commission pending for order {order.id}",
        order_id=order.id,
        payment_id=payment.id,
        commission_id=commission.id,
        created_by=actor_account_id,
    )

    log_order_event(
        db,
        tenant_id=order.tenant_id,
        entity_type="commission",
        entity_id=commission.id,
        event_type="commission_created",
        payload={"orderId": order.id, "amount": commission_amount},
        actor_account_id=actor_account_id,
    )
    return commission


def release_commission_to_available(
    db: Session,
    commission_id: str,
    *,
    admin_account_id: str,
    tenant_id: str,
) -> dict[str, Any]:
    commission = (
        db.query(Commission)
        .filter(Commission.id == commission_id, Commission.tenant_id == tenant_id)
        .first()
    )
    if not commission:
        raise AppError(ApiErrorCode.NOT_FOUND, "Commission not found", status_code=404)
    if commission.status not in (CommissionStatus.PENDING, CommissionStatus.ON_HOLD):
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"Cannot release commission in status {commission.status}",
            status_code=400,
        )

    now = _now()
    amount = commission.commission_amount
    balance = get_or_create_partner_balance(
        db, commission.tenant_id, commission.partner_id, commission.currency
    )

    if commission.status == CommissionStatus.PENDING:
        balance.pending_balance = _round_money(max(0, balance.pending_balance - amount))
    elif commission.status == CommissionStatus.ON_HOLD:
        balance.on_hold_balance = _round_money(max(0, balance.on_hold_balance - amount))

    balance.available_balance = _round_money(balance.available_balance + amount)
    balance.updated_at = now

    commission.status = CommissionStatus.AVAILABLE
    commission.available_at = now
    commission.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=commission.tenant_id,
        partner_id=commission.partner_id,
        entry_type=LedgerEntryType.PARTNER_COMMISSION_AVAILABLE,
        direction=LedgerDirection.CREDIT,
        amount=amount,
        currency=commission.currency,
        description=f"Commission released to available {commission.id}",
        order_id=commission.order_id,
        commission_id=commission.id,
        created_by=admin_account_id,
    )
    db.flush()
    return commission_to_dict(commission)


def hold_commission(
    db: Session,
    commission_id: str,
    *,
    reason: str,
    admin_account_id: str,
    tenant_id: str,
) -> dict[str, Any]:
    commission = (
        db.query(Commission)
        .filter(Commission.id == commission_id, Commission.tenant_id == tenant_id)
        .first()
    )
    if not commission:
        raise AppError(ApiErrorCode.NOT_FOUND, "Commission not found", status_code=404)
    if commission.status not in (CommissionStatus.PENDING, CommissionStatus.AVAILABLE):
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"Cannot hold commission in status {commission.status}",
            status_code=400,
        )

    now = _now()
    amount = commission.commission_amount
    balance = get_or_create_partner_balance(
        db, commission.tenant_id, commission.partner_id, commission.currency
    )

    if commission.status == CommissionStatus.PENDING:
        balance.pending_balance = _round_money(max(0, balance.pending_balance - amount))
    elif commission.status == CommissionStatus.AVAILABLE:
        balance.available_balance = _round_money(max(0, balance.available_balance - amount))

    balance.on_hold_balance = _round_money(balance.on_hold_balance + amount)
    balance.updated_at = now

    commission.status = CommissionStatus.ON_HOLD
    commission.adjustment_reason = reason
    commission.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=commission.tenant_id,
        partner_id=commission.partner_id,
        entry_type=LedgerEntryType.PARTNER_COMMISSION_HOLD,
        direction=LedgerDirection.DEBIT,
        amount=amount,
        currency=commission.currency,
        description=f"Commission on hold: {reason}",
        order_id=commission.order_id,
        commission_id=commission.id,
        metadata={"reason": reason},
        created_by=admin_account_id,
    )
    db.flush()
    return commission_to_dict(commission)


def cancel_commission_for_refund(
    db: Session,
    order_id: str,
    *,
    reason: str,
    actor_account_id: str | None = None,
) -> Commission | None:
    commission = db.query(Commission).filter(Commission.order_id == order_id).first()
    if not commission:
        return None
    if commission.status in (CommissionStatus.CANCELLED, CommissionStatus.PAID):
        return commission

    now = _now()
    amount = commission.commission_amount
    balance = get_or_create_partner_balance(
        db, commission.tenant_id, commission.partner_id, commission.currency
    )

    if commission.status == CommissionStatus.PENDING:
        balance.pending_balance = _round_money(max(0, balance.pending_balance - amount))
    elif commission.status == CommissionStatus.AVAILABLE:
        balance.available_balance = _round_money(max(0, balance.available_balance - amount))
    elif commission.status == CommissionStatus.ON_HOLD:
        balance.on_hold_balance = _round_money(max(0, balance.on_hold_balance - amount))

    balance.refunded_total = _round_money(balance.refunded_total + amount)
    balance.updated_at = now

    commission.status = CommissionStatus.CANCELLED
    commission.cancelled_at = now
    commission.adjustment_reason = reason
    commission.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=commission.tenant_id,
        partner_id=commission.partner_id,
        entry_type=LedgerEntryType.PARTNER_COMMISSION_CANCELLED,
        direction=LedgerDirection.DEBIT,
        amount=amount,
        currency=commission.currency,
        description=f"Commission cancelled due to refund: {reason}",
        order_id=order_id,
        commission_id=commission.id,
        metadata={"reason": reason},
        created_by=actor_account_id,
    )
    post_ledger_entry(
        db,
        tenant_id=commission.tenant_id,
        partner_id=commission.partner_id,
        entry_type=LedgerEntryType.REFUND,
        direction=LedgerDirection.DEBIT,
        amount=amount,
        currency=commission.currency,
        description=f"Refund commission reversal for order {order_id}",
        order_id=order_id,
        commission_id=commission.id,
        created_by=actor_account_id,
    )
    db.flush()
    return commission


def create_manual_adjustment(
    db: Session,
    tenant_id: str,
    partner_id: str,
    amount: float,
    currency: str,
    reason: str,
    *,
    admin_account_id: str,
) -> dict[str, Any]:
    if not reason or not reason.strip():
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Adjustment reason is required", status_code=400)
    if amount == 0:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Adjustment amount cannot be zero", status_code=400)

    now = _now()
    balance = get_or_create_partner_balance(db, tenant_id, partner_id, currency)

    if amount > 0:
        balance.available_balance = _round_money(balance.available_balance + amount)
        direction = LedgerDirection.CREDIT
    else:
        abs_amount = abs(amount)
        if balance.available_balance < abs_amount:
            raise AppError(
                ApiErrorCode.VALIDATION_ERROR,
                "Insufficient available balance for debit adjustment",
                status_code=400,
            )
        balance.available_balance = _round_money(balance.available_balance - abs_amount)
        direction = LedgerDirection.DEBIT

    balance.adjusted_total = _round_money(balance.adjusted_total + abs(amount))
    balance.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=tenant_id,
        partner_id=partner_id,
        entry_type=LedgerEntryType.MANUAL_ADJUSTMENT,
        direction=direction,
        amount=abs(amount),
        currency=currency,
        description=f"Manual adjustment: {reason}",
        metadata={"reason": reason},
        created_by=admin_account_id,
    )
    db.flush()
    return balance_to_dict(balance)


def create_payout_draft(
    db: Session,
    tenant_id: str,
    partner_id: str,
    amount: float,
    currency: str,
    *,
    admin_account_id: str,
    notes: str | None = None,
    period_start: datetime | None = None,
    period_end: datetime | None = None,
) -> dict[str, Any]:
    if amount <= 0:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Payout amount must be positive", status_code=400)

    balance = get_or_create_partner_balance(db, tenant_id, partner_id, currency)
    if amount > balance.available_balance:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Payout amount exceeds available balance",
            status_code=400,
        )

    now = _now()
    payout = Payout(
        id=new_id("payout"),
        tenant_id=tenant_id,
        partner_id=partner_id,
        currency=currency,
        amount=_round_money(amount),
        status=PayoutStatus.DRAFT,
        period_start=period_start,
        period_end=period_end,
        method=PayoutMethodType.MANUAL,
        notes=notes,
        created_by_admin_id=admin_account_id,
        created_at=now,
        updated_at=now,
    )
    db.add(payout)
    db.flush()

    post_ledger_entry(
        db,
        tenant_id=tenant_id,
        partner_id=partner_id,
        entry_type=LedgerEntryType.PAYOUT_CREATED,
        direction=LedgerDirection.DEBIT,
        amount=amount,
        currency=currency,
        description=f"Payout draft created {payout.id}",
        payout_id=payout.id,
        created_by=admin_account_id,
    )
    db.flush()
    return payout_to_dict(payout)


def approve_payout(
    db: Session,
    payout_id: str,
    *,
    admin_account_id: str,
    tenant_id: str,
) -> dict[str, Any]:
    payout = (
        db.query(Payout)
        .filter(Payout.id == payout_id, Payout.tenant_id == tenant_id)
        .first()
    )
    if not payout:
        raise AppError(ApiErrorCode.NOT_FOUND, "Payout not found", status_code=404)
    if payout.status not in (PayoutStatus.DRAFT, PayoutStatus.PENDING_APPROVAL):
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"Cannot approve payout in status {payout.status}",
            status_code=400,
        )

    balance = get_or_create_partner_balance(
        db, payout.tenant_id, payout.partner_id, payout.currency
    )
    if payout.amount > balance.available_balance:
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            "Payout amount exceeds available balance",
            status_code=400,
        )

    now = _now()
    balance.available_balance = _round_money(balance.available_balance - payout.amount)
    balance.updated_at = now

    payout.status = PayoutStatus.APPROVED
    payout.approved_at = now
    payout.approved_by_admin_id = admin_account_id
    payout.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=payout.tenant_id,
        partner_id=payout.partner_id,
        entry_type=LedgerEntryType.PAYOUT_APPROVED,
        direction=LedgerDirection.DEBIT,
        amount=payout.amount,
        currency=payout.currency,
        description=f"Payout approved {payout.id}",
        payout_id=payout.id,
        created_by=admin_account_id,
    )
    db.flush()
    return payout_to_dict(payout)


def mark_payout_paid(
    db: Session,
    payout_id: str,
    *,
    admin_account_id: str,
    tenant_id: str,
    note: str | None = None,
) -> dict[str, Any]:
    payout = (
        db.query(Payout)
        .filter(Payout.id == payout_id, Payout.tenant_id == tenant_id)
        .first()
    )
    if not payout:
        raise AppError(ApiErrorCode.NOT_FOUND, "Payout not found", status_code=404)
    if payout.status == PayoutStatus.PAID:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Payout already marked paid", status_code=400)
    if payout.status not in (PayoutStatus.APPROVED, PayoutStatus.PROCESSING):
        raise AppError(
            ApiErrorCode.VALIDATION_ERROR,
            f"Cannot mark paid from status {payout.status}",
            status_code=400,
        )

    now = _now()
    balance = get_or_create_partner_balance(
        db, payout.tenant_id, payout.partner_id, payout.currency
    )
    balance.paid_out_total = _round_money(balance.paid_out_total + payout.amount)
    balance.updated_at = now

    payout.status = PayoutStatus.PAID
    payout.paid_at = now
    payout.paid_by_admin_id = admin_account_id
    payout.updated_at = now
    if note:
        payout.notes = note

    post_ledger_entry(
        db,
        tenant_id=payout.tenant_id,
        partner_id=payout.partner_id,
        entry_type=LedgerEntryType.PAYOUT_PAID,
        direction=LedgerDirection.DEBIT,
        amount=payout.amount,
        currency=payout.currency,
        description=f"Payout paid {payout.id}",
        payout_id=payout.id,
        created_by=admin_account_id,
    )
    db.flush()
    return payout_to_dict(payout)


def mark_payout_failed(
    db: Session,
    payout_id: str,
    *,
    admin_account_id: str,
    tenant_id: str,
    reason: str,
) -> dict[str, Any]:
    payout = (
        db.query(Payout)
        .filter(Payout.id == payout_id, Payout.tenant_id == tenant_id)
        .first()
    )
    if not payout:
        raise AppError(ApiErrorCode.NOT_FOUND, "Payout not found", status_code=404)
    if payout.status == PayoutStatus.PAID:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Paid payout cannot be failed", status_code=400)

    now = _now()
    if payout.status == PayoutStatus.APPROVED:
        balance = get_or_create_partner_balance(
            db, payout.tenant_id, payout.partner_id, payout.currency
        )
        balance.available_balance = _round_money(balance.available_balance + payout.amount)
        balance.updated_at = now

    payout.status = PayoutStatus.FAILED
    payout.failed_at = now
    payout.failure_reason = reason
    payout.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=payout.tenant_id,
        partner_id=payout.partner_id,
        entry_type=LedgerEntryType.PAYOUT_FAILED,
        direction=LedgerDirection.CREDIT,
        amount=payout.amount,
        currency=payout.currency,
        description=f"Payout failed: {reason}",
        payout_id=payout.id,
        created_by=admin_account_id,
    )
    db.flush()
    return payout_to_dict(payout)


def cancel_payout(
    db: Session,
    payout_id: str,
    *,
    admin_account_id: str,
    tenant_id: str,
) -> dict[str, Any]:
    payout = (
        db.query(Payout)
        .filter(Payout.id == payout_id, Payout.tenant_id == tenant_id)
        .first()
    )
    if not payout:
        raise AppError(ApiErrorCode.NOT_FOUND, "Payout not found", status_code=404)
    if payout.status == PayoutStatus.PAID:
        raise AppError(ApiErrorCode.VALIDATION_ERROR, "Paid payout cannot be cancelled", status_code=400)

    now = _now()
    if payout.status == PayoutStatus.APPROVED:
        balance = get_or_create_partner_balance(
            db, payout.tenant_id, payout.partner_id, payout.currency
        )
        balance.available_balance = _round_money(balance.available_balance + payout.amount)
        balance.updated_at = now

    payout.status = PayoutStatus.CANCELLED
    payout.cancelled_at = now
    payout.updated_at = now

    post_ledger_entry(
        db,
        tenant_id=payout.tenant_id,
        partner_id=payout.partner_id,
        entry_type=LedgerEntryType.PAYOUT_CANCELLED,
        direction=LedgerDirection.CREDIT,
        amount=payout.amount,
        currency=payout.currency,
        description=f"Payout cancelled {payout.id}",
        payout_id=payout.id,
        created_by=admin_account_id,
    )
    db.flush()
    return payout_to_dict(payout)


def mark_payment_refunded(
    db: Session,
    tenant_id: str,
    order_id: str,
    *,
    reason: str,
    actor_account_id: str,
) -> dict[str, Any] | None:
    order = (
        db.query(Order)
        .filter(Order.tenant_id == tenant_id, Order.id == order_id)
        .first()
    )
    if not order:
        return None

    now = _now()
    order.status = "refunded"
    order.payment_status = "refunded"
    order.refunded_at = now
    save_order(db, order)

    payment = (
        db.query(Payment)
        .filter(Payment.tenant_id == tenant_id, Payment.order_id == order_id)
        .first()
    )
    if payment:
        payment.status = PaymentStatus.REFUNDED
        payment.refunded_at = now
        payment.updated_at = now

    cancel_commission_for_refund(
        db, order_id, reason=reason, actor_account_id=actor_account_id
    )
    db.flush()
    return payment_to_dict(payment) if payment else {"orderId": order_id, "status": "refunded"}


def update_payment_status_from_sync(
    db: Session,
    order: Order,
    payment_status: dict[str, Any],
) -> None:
    """Update payment record for non-paid terminal states without creating commission."""
    external_id = order.external_payment_id
    if not external_id:
        return

    status = str(payment_status.get("status") or "")
    if status == PaymentStatus.PAID:
        return

    existing = (
        db.query(Payment)
        .filter(Payment.tenant_id == order.tenant_id, Payment.external_payment_id == external_id)
        .first()
    )
    now = _now()
    if existing:
        existing.status = status
        existing.updated_at = now
        if status in (PaymentStatus.FAILED, PaymentStatus.CANCELLED, PaymentStatus.EXPIRED):
            existing.failed_at = now
    else:
        payment = Payment(
            id=new_id("pay"),
            tenant_id=order.tenant_id,
            order_id=order.id,
            end_user_id=order.end_user_id,
            provider=str(payment_status.get("provider") or "mock"),
            external_payment_id=external_id,
            amount=float(payment_status.get("amount") or order.amount),
            currency=str(payment_status.get("currency") or order.currency),
            status=status,
            created_at=now,
            updated_at=now,
            failed_at=now if status in (PaymentStatus.FAILED, PaymentStatus.CANCELLED) else None,
        )
        db.add(payment)
    db.flush()


def recalculate_partner_balance(
    db: Session, tenant_id: str, partner_id: str, currency: str
) -> dict[str, Any]:
    """Rebuild balance buckets from commissions and payouts (recovery helper)."""
    balance = get_or_create_partner_balance(db, tenant_id, partner_id, currency)
    commissions = (
        db.query(Commission)
        .filter(
            Commission.tenant_id == tenant_id,
            Commission.partner_id == partner_id,
            Commission.currency == currency,
        )
        .all()
    )

    pending = available = on_hold = paid_comm = cancelled = 0.0
    for c in commissions:
        if c.status == CommissionStatus.PENDING:
            pending += c.commission_amount
        elif c.status == CommissionStatus.AVAILABLE:
            available += c.commission_amount
        elif c.status == CommissionStatus.ON_HOLD:
            on_hold += c.commission_amount
        elif c.status == CommissionStatus.PAID:
            paid_comm += c.commission_amount
        elif c.status == CommissionStatus.CANCELLED:
            cancelled += c.commission_amount

    payouts = (
        db.query(Payout)
        .filter(
            Payout.tenant_id == tenant_id,
            Payout.partner_id == partner_id,
            Payout.currency == currency,
            Payout.status == PayoutStatus.PAID,
        )
        .all()
    )
    paid_out = sum(p.amount for p in payouts)

    adjustments = (
        db.query(LedgerEntry)
        .filter(
            LedgerEntry.tenant_id == tenant_id,
            LedgerEntry.partner_id == partner_id,
            LedgerEntry.currency == currency,
            LedgerEntry.type == LedgerEntryType.MANUAL_ADJUSTMENT,
        )
        .all()
    )
    adjusted = sum(e.amount for e in adjustments)

    balance.pending_balance = _round_money(pending)
    balance.available_balance = _round_money(available)
    balance.on_hold_balance = _round_money(on_hold)
    balance.paid_out_total = _round_money(paid_out)
    balance.adjusted_total = _round_money(adjusted)
    balance.refunded_total = _round_money(cancelled)
    balance.updated_at = _now()
    db.flush()
    return balance_to_dict(balance)


def handle_paid_order_finance(
    db: Session,
    order: Order,
    payment_status: dict[str, Any],
    *,
    actor_account_id: str | None = None,
) -> bool:
    """Idempotent finance posting for paid orders. Returns True if newly processed."""
    if order.amount <= 0 or not order.partner_id:
        record_payment_confirmed(db, order, payment_status, actor_account_id=actor_account_id)
        return True

    existing_commission = (
        db.query(Commission).filter(Commission.order_id == order.id).first()
    )
    if existing_commission:
        record_payment_confirmed(db, order, payment_status, actor_account_id=actor_account_id)
        return False

    record_payment_confirmed(db, order, payment_status, actor_account_id=actor_account_id)
    return True


def _compute_balance_buckets(
    db: Session, tenant_id: str, partner_id: str, currency: str
) -> dict[str, float]:
    commissions = (
        db.query(Commission)
        .filter(
            Commission.tenant_id == tenant_id,
            Commission.partner_id == partner_id,
            Commission.currency == currency,
        )
        .all()
    )

    pending = available = on_hold = paid_comm = cancelled = 0.0
    for c in commissions:
        if c.status == CommissionStatus.PENDING:
            pending += c.commission_amount
        elif c.status == CommissionStatus.AVAILABLE:
            available += c.commission_amount
        elif c.status == CommissionStatus.ON_HOLD:
            on_hold += c.commission_amount
        elif c.status == CommissionStatus.PAID:
            paid_comm += c.commission_amount
        elif c.status == CommissionStatus.CANCELLED:
            cancelled += c.commission_amount

    payouts = (
        db.query(Payout)
        .filter(
            Payout.tenant_id == tenant_id,
            Payout.partner_id == partner_id,
            Payout.currency == currency,
            Payout.status == PayoutStatus.PAID,
        )
        .all()
    )
    paid_out = sum(p.amount for p in payouts)

    adjustments = (
        db.query(LedgerEntry)
        .filter(
            LedgerEntry.tenant_id == tenant_id,
            LedgerEntry.partner_id == partner_id,
            LedgerEntry.currency == currency,
            LedgerEntry.type == LedgerEntryType.MANUAL_ADJUSTMENT,
        )
        .all()
    )
    adjusted = sum(e.amount for e in adjustments)

    return {
        "pending": _round_money(pending),
        "available": _round_money(available),
        "onHold": _round_money(on_hold),
        "paidOut": _round_money(paid_out),
        "adjusted": _round_money(adjusted),
        "refunded": _round_money(cancelled),
    }


def verify_partner_balance(
    db: Session, tenant_id: str, partner_id: str, currency: str = "USD"
) -> dict[str, Any]:
    """Compare stored partner balance with recomputed buckets (dry-run)."""
    balance = get_or_create_partner_balance(db, tenant_id, partner_id, currency)
    stored = {
        "pending": _round_money(balance.pending_balance),
        "available": _round_money(balance.available_balance),
        "onHold": _round_money(balance.on_hold_balance),
        "paidOut": _round_money(balance.paid_out_total),
        "adjusted": _round_money(balance.adjusted_total),
        "refunded": _round_money(balance.refunded_total),
    }
    computed = _compute_balance_buckets(db, tenant_id, partner_id, currency)
    delta = {key: _round_money(stored[key] - computed[key]) for key in stored}
    status = "ok" if all(value == 0 for value in delta.values()) else "mismatch"
    return {
        "partnerId": partner_id,
        "currency": currency,
        "stored": stored,
        "computed": computed,
        "delta": delta,
        "status": status,
    }
