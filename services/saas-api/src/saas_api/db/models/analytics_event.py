from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import JSON

from saas_api.db.base import Base


class AnalyticsSource(StrEnum):
    MINIAPP = "miniapp"
    DASHBOARD = "dashboard"
    SUPERADMIN = "superadmin"
    BACKEND = "backend"


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"
    __table_args__ = (
        Index("ix_analytics_events_tenant_created", "tenant_id", "created_at"),
        Index("ix_analytics_events_name_created", "event_name", "created_at"),
        Index("ix_analytics_events_end_user_created", "end_user_id", "created_at"),
        Index("ix_analytics_events_actor_created", "actor_account_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=True
    )
    end_user_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("end_users.id"), nullable=True
    )
    actor_account_id: Mapped[str | None] = mapped_column(
        String(64), ForeignKey("accounts.id"), nullable=True
    )
    session_id: Mapped[str | None] = mapped_column(String(128), nullable=True)
    event_name: Mapped[str] = mapped_column(String(128), nullable=False)
    source: Mapped[str] = mapped_column(String(32), nullable=False)
    locale: Mapped[str | None] = mapped_column(String(8), nullable=True)
    properties_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
