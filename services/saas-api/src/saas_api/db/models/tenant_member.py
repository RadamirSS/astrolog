from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from saas_api.db.base import Base


class TenantMemberRole(StrEnum):
    OWNER = "owner"
    MANAGER = "manager"
    VIEWER = "viewer"


class TenantMember(Base):
    __tablename__ = "tenant_members"
    __table_args__ = (UniqueConstraint("tenant_id", "account_id", name="uq_tenant_member"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), ForeignKey("tenants.id"), nullable=False)
    account_id: Mapped[str] = mapped_column(String(64), ForeignKey("accounts.id"), nullable=False)
    role: Mapped[str] = mapped_column(String(16), nullable=False, default=TenantMemberRole.OWNER)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    tenant: Mapped["Tenant"] = relationship(back_populates="members")
    account: Mapped["Account"] = relationship()


from saas_api.db.models.account import Account  # noqa: E402
from saas_api.db.models.tenant import Tenant  # noqa: E402
