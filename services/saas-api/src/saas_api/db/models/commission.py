from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class CommissionStatus(StrEnum):
    PENDING = "pending"
    AVAILABLE = "available"
    ON_HOLD = "on_hold"
    APPROVED = "approved"
    PAID = "paid"
    CANCELLED = "cancelled"
    ADJUSTED = "adjusted"


class Commission(Base):
    __tablename__ = "commissions"
    __table_args__ = (UniqueConstraint("order_id", name="uq_commission_order"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    partner_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    order_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("orders.id"), nullable=False, unique=True
    )
    payment_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    product_type: Mapped[str] = mapped_column(String(64), nullable=False)
    gross_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    commission_rate: Mapped[float] = mapped_column(Float, nullable=False)
    commission_amount: Mapped[float] = mapped_column(Float, nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    hold_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    available_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    adjustment_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
