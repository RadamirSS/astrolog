"""Telegram bot integrations for creator mini apps."""

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import DateTime, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from saas_api.db.base import Base


class TelegramIntegrationStatus(StrEnum):
    NOT_CONNECTED = "not_connected"
    CONNECTED = "connected"
    INVALID_TOKEN = "invalid_token"
    WEBHOOK_CONFIGURED = "webhook_configured"
    ERROR = "error"
    DISCONNECTED = "disconnected"


class TelegramBotIntegration(Base):
    __tablename__ = "telegram_bot_integrations"
    __table_args__ = (UniqueConstraint("tenant_id", name="uq_telegram_bot_integrations_tenant"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    tenant_id: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    mini_app_slug: Mapped[str | None] = mapped_column(String(128), nullable=True)
    bot_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bot_username: Mapped[str | None] = mapped_column(String(128), nullable=True)
    bot_display_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    status: Mapped[str] = mapped_column(
        String(32), nullable=False, default=TelegramIntegrationStatus.NOT_CONNECTED
    )
    webhook_status: Mapped[str] = mapped_column(String(32), nullable=False, default="not_configured")
    menu_status: Mapped[str] = mapped_column(String(32), nullable=False, default="not_configured")
    last_validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    encrypted_token: Mapped[str | None] = mapped_column(Text, nullable=True)
    secret_ref: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    def to_status_dict(self) -> dict:
        return {
            "integrationId": self.id,
            "tenantId": self.tenant_id,
            "botId": self.bot_id,
            "botUsername": self.bot_username,
            "botDisplayName": self.bot_display_name,
            "status": self.status,
            "webhookStatus": self.webhook_status,
            "menuStatus": self.menu_status,
            "lastValidatedAt": self.last_validated_at.isoformat() if self.last_validated_at else None,
            "errorCode": self.error_code,
            "errorMessage": self.error_message,
            "miniAppUrl": f"/b/{self.mini_app_slug}" if self.mini_app_slug else None,
            "deepLink": (
                f"https://t.me/{self.bot_username}?startapp={self.mini_app_slug}"
                if self.bot_username and self.mini_app_slug
                else None
            ),
        }
