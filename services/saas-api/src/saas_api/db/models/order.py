from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from saas_api.db.base import Base


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    end_user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("end_users.id"), nullable=False, index=True
    )
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    product_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    product_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    product_title: Mapped[str] = mapped_column(String(256), nullable=False)
    theme: Mapped[str | None] = mapped_column(String(32), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency: Mapped[str] = mapped_column(String(8), nullable=False, default="USD")
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    payment_status: Mapped[str] = mapped_column(String(32), nullable=False)
    report_status: Mapped[str] = mapped_column(String(32), nullable=False, default="locked")
    entitlement_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    entitlement_status: Mapped[str | None] = mapped_column(String(32), nullable=True)
    external_payment_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    external_report_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    payment_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    partner_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    partner_slug: Mapped[str | None] = mapped_column(String(128), nullable=True)
    campaign_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    birth_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    needs_review: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    report_error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    report_error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    report_progress: Mapped[int | None] = mapped_column(Integer, nullable=True)
    admin_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    paid_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refunded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
