from datetime import UTC, datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class PartnerBalance(Base):
    __tablename__ = "partner_balances"
    __table_args__ = (
        UniqueConstraint("tenant_id", "partner_id", "currency", name="uq_partner_balance"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    partner_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    pending_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    available_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    on_hold_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    paid_out_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    adjusted_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    refunded_total: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
