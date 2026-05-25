from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from saas_api.db.base import Base


class TenantStatus(StrEnum):
    DRAFT = "draft"
    ACTIVE = "active"
    PAUSED = "paused"


class Tenant(Base):
    __tablename__ = "tenants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    slug: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(16), nullable=False, default=TenantStatus.DRAFT)
    created_by_account_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("accounts.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )

    members: Mapped[list["TenantMember"]] = relationship(back_populates="tenant")
    configs: Mapped[list["TenantConfig"]] = relationship(back_populates="tenant")
    integration_statuses: Mapped[list["IntegrationStatus"]] = relationship(back_populates="tenant")


from saas_api.db.models.integration_status import IntegrationStatus  # noqa: E402
from saas_api.db.models.tenant_config import TenantConfig  # noqa: E402
from saas_api.db.models.tenant_member import TenantMember  # noqa: E402
