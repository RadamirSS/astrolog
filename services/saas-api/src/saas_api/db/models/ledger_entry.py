from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from saas_api.db.base import Base


class LedgerEntryType(StrEnum):
    PAYMENT_RECEIVED = "payment_received"
    PROVIDER_FEE = "provider_fee"
    PLATFORM_REVENUE = "platform_revenue"
    PARTNER_COMMISSION_PENDING = "partner_commission_pending"
    PARTNER_COMMISSION_AVAILABLE = "partner_commission_available"
    PARTNER_COMMISSION_HOLD = "partner_commission_hold"
    PARTNER_COMMISSION_CANCELLED = "partner_commission_cancelled"
    PARTNER_COMMISSION_ADJUSTED = "partner_commission_adjusted"
    REFUND = "refund"
    CHARGEBACK = "chargeback"
    MANUAL_ADJUSTMENT = "manual_adjustment"
    PAYOUT_CREATED = "payout_created"
    PAYOUT_APPROVED = "payout_approved"
    PAYOUT_PAID = "payout_paid"
    PAYOUT_FAILED = "payout_failed"
    PAYOUT_CANCELLED = "payout_cancelled"


class LedgerDirection(StrEnum):
    CREDIT = "credit"
    DEBIT = "debit"


class LedgerEntryStatus(StrEnum):
    PENDING = "pending"
    POSTED = "posted"
    VOIDED = "voided"
    REVERSED = "reversed"


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    partner_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    order_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    commission_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    payout_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    direction: Mapped[str] = mapped_column(String(16), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(16), nullable=False, default=LedgerEntryStatus.POSTED)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    metadata_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(UTC)
    )
    created_by: Mapped[str | None] = mapped_column(String(64), nullable=True)
