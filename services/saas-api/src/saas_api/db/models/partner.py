from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class PartnerStatus(StrEnum):
    ACTIVE = "active"
    PAUSED = "paused"
    PENDING = "pending"
    BLOCKED = "blocked"


class Partner(Base):
    __tablename__ = "partners"
    __table_args__ = (
        UniqueConstraint("tenant_id", "slug", name="uq_partner_tenant_slug"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    slug: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=PartnerStatus.ACTIVE)
    default_commission_rate: Mapped[float] = mapped_column(Float, nullable=False, default=0.5)
    product_commission_rates_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    contact: Mapped[str | None] = mapped_column(String(256), nullable=True)
    default_visual_pack: Mapped[str | None] = mapped_column(String(64), nullable=True)
    default_topic: Mapped[str | None] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
