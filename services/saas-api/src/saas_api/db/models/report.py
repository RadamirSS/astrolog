from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from saas_api.db.base import Base


class ReportStatus(StrEnum):
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    end_user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("end_users.id"), nullable=False, index=True
    )
    birth_profile_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("birth_profiles.id"), nullable=True
    )
    order_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    entitlement_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    product_type: Mapped[str | None] = mapped_column(String(64), nullable=True)
    theme: Mapped[str | None] = mapped_column(String(32), nullable=True)
    pdf_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    report_type: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(16), nullable=False, index=True)
    locale: Mapped[str] = mapped_column(String(8), nullable=False, default="en")
    request_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    report_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
