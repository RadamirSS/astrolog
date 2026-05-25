from datetime import UTC, datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class BirthProfile(Base):
    __tablename__ = "birth_profiles"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("tenants.id"), nullable=False, index=True
    )
    end_user_id: Mapped[str] = mapped_column(
        String(64), ForeignKey("end_users.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    birth_date: Mapped[str] = mapped_column(String(32), nullable=False)
    birth_time: Mapped[str | None] = mapped_column(String(16), nullable=True)
    birth_city: Mapped[str] = mapped_column(String(256), nullable=False)
    topic: Mapped[str] = mapped_column(String(64), nullable=False)
    locale: Mapped[str] = mapped_column(String(8), nullable=False, default="en")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
