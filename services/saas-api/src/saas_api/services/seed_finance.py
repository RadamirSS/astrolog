"""Seed finance demo data for development/staging (not production)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

from sqlalchemy.orm import Session

from saas_api.auth.passwords import new_id
from saas_api.db.models.commission import Commission, CommissionStatus
from saas_api.db.models.ledger_entry import LedgerDirection, LedgerEntryType
from saas_api.db.models.order import Order
from saas_api.db.models.partner_balance import PartnerBalance
from saas_api.db.models.payment import Payment, PaymentStatus
from saas_api.db.models.payout import Payout, PayoutMethodType, PayoutStatus
from saas_api.services.finance_service import get_or_create_partner_balance, post_ledger_entry
from saas_api.settings import settings


def seed_finance_demo(db: Session, tenant_id: str = "tenant_mystic") -> None:
    if settings.app_env == "production":
        return

    existing = db.query(Payment).filter(Payment.tenant_id == tenant_id).first()
    if existing:
        return

    now = datetime.now(UTC)
    partners = ["partner_nicole", "partner_luna", "partner_mira"]
    product_specs = [
        ("low_ticket_money", "Денежный код", 29.0, "partner_luna"),
        ("low_ticket_relationships", "Код отношений", 29.0, "partner_nicole"),
        ("low_ticket_personality", "Личностный портрет", 29.0, "partner_nicole"),
        ("bundle_all_topics", "Bundle: 3 темы", 69.0, "partner_nicole"),
        ("main_natal_portrait", "Полный астрологический портрет", 149.0, "partner_luna"),
    ]

    for i, (product_type, title, amount, partner_id) in enumerate(product_specs):
        order_id = f"ord_fin_seed_{i:02d}"
        if db.get(Order, order_id):
            continue
        order = Order(
            id=order_id,
            tenant_id=tenant_id,
            end_user_id="eu_seed_finance",
            product_type=product_type,
            product_title=title,
            amount=amount,
            currency="USD",
            status="paid",
            payment_status="paid",
            report_status="ready",
            partner_id=partner_id,
            partner_slug=partner_id.replace("partner_", ""),
            external_payment_id=f"pay_fin_seed_{i:02d}",
            paid_at=now - timedelta(days=10 - i),
            created_at=now - timedelta(days=11 - i),
            updated_at=now,
        )
        db.add(order)
        db.flush()

        payment = Payment(
            id=new_id("pay"),
            tenant_id=tenant_id,
            order_id=order_id,
            end_user_id="eu_seed_finance",
            provider="mock",
            external_payment_id=order.external_payment_id,
            amount=amount,
            currency="USD",
            status=PaymentStatus.PAID,
            provider_fee=round(amount * 0.03, 2),
            platform_received_amount=round(amount * 0.97, 2),
            confirmed_at=order.paid_at,
            created_at=order.created_at,
            updated_at=now,
        )
        db.add(payment)
        db.flush()

        rate = 0.5 if partner_id == "partner_nicole" else 0.4 if partner_id == "partner_luna" else 0.35
        commission_amount = round(amount * rate, 2)
        status = CommissionStatus.PENDING if i < 2 else CommissionStatus.AVAILABLE if i < 4 else CommissionStatus.ON_HOLD
        commission = Commission(
            id=new_id("comm"),
            tenant_id=tenant_id,
            partner_id=partner_id,
            order_id=order_id,
            payment_id=payment.id,
            product_type=product_type,
            gross_amount=amount,
            currency="USD",
            commission_rate=rate,
            commission_amount=commission_amount,
            status=status,
            hold_until=now + timedelta(days=7),
            available_at=now if status == CommissionStatus.AVAILABLE else None,
            created_at=now,
            updated_at=now,
        )
        db.add(commission)
        db.flush()

        balance = get_or_create_partner_balance(db, tenant_id, partner_id, "USD")
        if status == CommissionStatus.PENDING:
            balance.pending_balance = round(balance.pending_balance + commission_amount, 2)
        elif status == CommissionStatus.AVAILABLE:
            balance.available_balance = round(balance.available_balance + commission_amount, 2)
        elif status == CommissionStatus.ON_HOLD:
            balance.on_hold_balance = round(balance.on_hold_balance + commission_amount, 2)
        balance.updated_at = now

        post_ledger_entry(
            db,
            tenant_id=tenant_id,
            entry_type=LedgerEntryType.PAYMENT_RECEIVED,
            direction=LedgerDirection.CREDIT,
            amount=amount,
            currency="USD",
            description=f"Seed payment {order_id}",
            order_id=order_id,
            payment_id=payment.id,
        )
        post_ledger_entry(
            db,
            tenant_id=tenant_id,
            partner_id=partner_id,
            entry_type=LedgerEntryType.PARTNER_COMMISSION_PENDING,
            direction=LedgerDirection.CREDIT,
            amount=commission_amount,
            currency="USD",
            description=f"Seed commission {commission.id}",
            order_id=order_id,
            commission_id=commission.id,
        )

    for partner_id in partners:
        balance = (
            db.query(PartnerBalance)
            .filter(
                PartnerBalance.tenant_id == tenant_id,
                PartnerBalance.partner_id == partner_id,
            )
            .first()
        )
        if not balance:
            continue
        payout = Payout(
            id=new_id("payout"),
            tenant_id=tenant_id,
            partner_id=partner_id,
            currency="USD",
            amount=min(50.0, balance.available_balance),
            status=PayoutStatus.DRAFT if partner_id != "partner_mira" else PayoutStatus.APPROVED,
            method=PayoutMethodType.MANUAL,
            created_at=now,
            updated_at=now,
            approved_at=now if partner_id == "partner_mira" else None,
        )
        if payout.amount > 0:
            db.add(payout)

    db.commit()
