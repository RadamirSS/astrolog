from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class PayoutMethodStatus(StrEnum):
    NOT_CONFIGURED = "not_configured"
    PENDING_REVIEW = "pending_review"
    VERIFIED = "verified"
    REJECTED = "rejected"
    DISABLED = "disabled"


class PayoutMethodRecord(Base):
    __tablename__ = "payout_methods"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    partner_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(32), nullable=False, default="manual")
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=PayoutMethodStatus.NOT_CONFIGURED
    )
    display_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    masked_details: Mapped[str | None] = mapped_column(String(512), nullable=True)
    external_token: Mapped[str | None] = mapped_column(String(256), nullable=True)
    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
