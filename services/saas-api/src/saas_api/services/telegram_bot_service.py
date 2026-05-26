from __future__ import annotations

import base64
import hashlib
import re
from datetime import UTC, datetime

import httpx
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.passwords import new_id
from saas_api.db.models.telegram_bot_integration import (
    TelegramBotIntegration,
    TelegramIntegrationStatus,
)
from saas_api.settings import settings

TOKEN_PATTERN = re.compile(r"^\d+:[A-Za-z0-9_-]{30,}$")


def _fernet() -> Fernet | None:
    key = settings.telegram_token_encryption_key.strip()
    if not key:
        return None
    try:
        return Fernet(key.encode("utf-8") if not key.startswith("gAAAA") else key)
    except Exception:
        digest = hashlib.sha256(key.encode("utf-8")).digest()
        return Fernet(base64.urlsafe_b64encode(digest))


def require_secure_token_storage() -> None:
    if settings.telegram_bot_setup_mode == "remote" and settings.app_env == "production":
        if not settings.telegram_token_encryption_key.strip():
            raise AppError(
                ApiErrorCode.CONFIG_INVALID,
                "TELEGRAM_TOKEN_ENCRYPTION_KEY is required for remote bot setup in production",
                status_code=503,
            )


def encrypt_token(token: str) -> str:
    require_secure_token_storage()
    fernet = _fernet()
    if fernet is None:
        if settings.telegram_bot_setup_mode == "mock":
            return f"mock:{token[:8]}..."
        raise AppError(
            ApiErrorCode.CONFIG_INVALID,
            "Secure token storage is not configured",
            status_code=503,
        )
    return fernet.encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted: str) -> str:
    if encrypted.startswith("mock:"):
        raise AppError(ApiErrorCode.CONFIG_INVALID, "Mock token cannot be decrypted", status_code=503)
    fernet = _fernet()
    if fernet is None:
        raise AppError(
            ApiErrorCode.CONFIG_INVALID,
            "Secure token storage is not configured",
            status_code=503,
        )
    try:
        return fernet.decrypt(encrypted.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise AppError(ApiErrorCode.CONFIG_INVALID, "Invalid encrypted token", status_code=500) from exc


async def validate_bot_token(token: str) -> dict:
    if not TOKEN_PATTERN.match(token):
        return {"valid": False, "errorMessage": "Invalid bot token format"}

    if settings.telegram_bot_setup_mode == "mock":
        bot_id = token.split(":")[0]
        return {
            "valid": True,
            "botId": bot_id,
            "botUsername": f"astro_bot_{bot_id[-4:]}",
            "botDisplayName": f"Astro Bot {bot_id[-4:]}",
        }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(f"https://api.telegram.org/bot{token}/getMe")
        payload = response.json()
        if not payload.get("ok"):
            return {"valid": False, "errorMessage": "Telegram rejected this bot token"}
        result = payload["result"]
        return {
            "valid": True,
            "botId": str(result.get("id")),
            "botUsername": result.get("username"),
            "botDisplayName": result.get("first_name"),
        }


def get_integration(db: Session, tenant_id: str) -> TelegramBotIntegration | None:
    return (
        db.query(TelegramBotIntegration)
        .filter(TelegramBotIntegration.tenant_id == tenant_id)
        .first()
    )


def get_integration_by_id(db: Session, integration_id: str) -> TelegramBotIntegration | None:
    return db.query(TelegramBotIntegration).filter(TelegramBotIntegration.id == integration_id).first()


async def connect_bot(db: Session, tenant_id: str, token: str, mini_app_slug: str | None) -> dict:
    validated = await validate_bot_token(token)
    if not validated.get("valid"):
        return {
            "integrationId": "",
            "tenantId": tenant_id,
            "status": TelegramIntegrationStatus.INVALID_TOKEN,
            "errorMessage": validated.get("errorMessage"),
        }

    encrypted = encrypt_token(token)
    now = datetime.now(UTC)
    row = get_integration(db, tenant_id)
    if row is None:
        row = TelegramBotIntegration(
            id=new_id("tg"),
            tenant_id=tenant_id,
            mini_app_slug=mini_app_slug,
            encrypted_token=encrypted,
            created_at=now,
            updated_at=now,
        )
        db.add(row)
    else:
        row.encrypted_token = encrypted
        row.mini_app_slug = mini_app_slug or row.mini_app_slug
        row.updated_at = now

    row.bot_id = validated.get("botId")
    row.bot_username = validated.get("botUsername")
    row.bot_display_name = validated.get("botDisplayName")
    row.status = TelegramIntegrationStatus.WEBHOOK_CONFIGURED
    row.webhook_status = "configured" if settings.telegram_bot_setup_mode == "mock" else "pending"
    row.menu_status = "configured" if settings.telegram_bot_setup_mode == "mock" else "pending"
    row.last_validated_at = now
    row.error_code = None
    row.error_message = None

    if settings.telegram_bot_setup_mode != "mock":
        await _configure_webhook_remote(row, token)
        await _configure_menu_remote(row, token)

    db.commit()
    db.refresh(row)
    return row.to_status_dict()


async def _configure_webhook_remote(row: TelegramBotIntegration, token: str) -> None:
    webhook_url = f"{settings.miniapp_public_base_url.rstrip('/')}/api/telegram/webhook/{row.id}"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"https://api.telegram.org/bot{token}/setWebhook",
            json={"url": webhook_url},
        )
        payload = response.json()
        if payload.get("ok"):
            row.webhook_status = "configured"
            row.status = TelegramIntegrationStatus.WEBHOOK_CONFIGURED
        else:
            row.webhook_status = "error"
            row.error_message = str(payload.get("description") or "Webhook setup failed")


async def _configure_menu_remote(row: TelegramBotIntegration, token: str) -> None:
    if not row.mini_app_slug:
        return
    mini_app_url = f"{settings.miniapp_public_base_url.rstrip('/')}/b/{row.mini_app_slug}"
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(
            f"https://api.telegram.org/bot{token}/setChatMenuButton",
            json={
                "menu_button": {
                    "type": "web_app",
                    "text": "Open App",
                    "web_app": {"url": mini_app_url},
                }
            },
        )
        payload = response.json()
        row.menu_status = "configured" if payload.get("ok") else "error"


def disconnect_bot(db: Session, tenant_id: str, integration_id: str | None = None) -> dict:
    row = get_integration(db, tenant_id)
    if row is None:
        return {
            "integrationId": integration_id or "",
            "tenantId": tenant_id,
            "status": TelegramIntegrationStatus.DISCONNECTED,
            "webhookStatus": "not_configured",
            "menuStatus": "not_configured",
        }
    row.encrypted_token = None
    row.status = TelegramIntegrationStatus.DISCONNECTED
    row.webhook_status = "not_configured"
    row.menu_status = "not_configured"
    row.bot_username = None
    row.bot_display_name = None
    row.updated_at = datetime.now(UTC)
    db.commit()
    return row.to_status_dict()


def get_status(db: Session, tenant_id: str) -> dict | None:
    row = get_integration(db, tenant_id)
    if row is None:
        return None
    return row.to_status_dict()
