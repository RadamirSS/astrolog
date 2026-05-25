from datetime import UTC, datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from saas_api.db.base import Base


class PremiumRequest(Base):
    __tablename__ = "premium_requests"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    end_user_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("end_users.id"), nullable=True, index=True
    )
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    order_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    product_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    product_type: Mapped[str] = mapped_column(String(64), nullable=False)
    product_title: Mapped[str] = mapped_column(String(256), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    topic: Mapped[str | None] = mapped_column(String(32), nullable=True)
    personal_question: Mapped[str | None] = mapped_column(Text, nullable=True)
    context: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_method: Mapped[str | None] = mapped_column(String(64), nullable=True)
    contact_value: Mapped[str | None] = mapped_column(String(256), nullable=True)
    desired_window: Mapped[str | None] = mapped_column(String(256), nullable=True)
    consent_accepted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    birth_profile: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    assigned_expert: Mapped[str | None] = mapped_column(String(256), nullable=True)
    admin_notes: Mapped[list | None] = mapped_column(JSON, nullable=True)
    final_pdf_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    timeline: Mapped[list | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
