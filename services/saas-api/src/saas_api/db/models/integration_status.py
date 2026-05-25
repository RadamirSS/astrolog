from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from saas_api.db.base import Base


class IntegrationModule(StrEnum):
    TELEGRAM = "telegram"
    PAYMENTS = "payments"
    ANALYTICS = "analytics"
    BACKEND_API = "backend_api"
    REPORT_GENERATION = "report_generation"


class IntegrationModuleStatus(StrEnum):
    NOT_CONFIGURED = "not_configured"
    COMING_LATER = "coming_later"
    MOCK_ONLY = "mock_only"
    ACTIVE = "active"
    ERROR = "error"


class IntegrationStatus(Base):
    __tablename__ = "integration_statuses"
    __table_args__ = (UniqueConstraint("tenant_id", "module", name="uq_integration_status"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), nullable=False)
    module: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="integration_statuses")


from saas_api.db.models.tenant import Tenant  # noqa: E402
