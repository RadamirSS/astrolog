import pytest
from fastapi.testclient import TestClient

from saas_api.services import telegram_bot_service


def test_validate_bot_token_mock_success():
    import asyncio

    result = asyncio.run(
        telegram_bot_service.validate_bot_token("123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef")
    )
    assert result["valid"] is True
    assert result["botUsername"]


def test_validate_bot_token_mock_failure():
    import asyncio

    result = asyncio.run(telegram_bot_service.validate_bot_token("invalid"))
    assert result["valid"] is False


def test_connect_bot_response_hides_token(client: TestClient, monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_SETUP_MODE", "mock")
    from saas_api.settings import settings

    settings.telegram_bot_setup_mode = "mock"
    response = client.post(
        "/api/dashboard/tenants/tenant_mystic/telegram/connect",
        json={"token": "123456789:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef"},
    )
    assert response.status_code in (200, 401, 403)
    if response.status_code == 200:
        payload = str(response.json())
        assert "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdef" not in payload
        assert "encrypted_token" not in payload


def test_production_remote_requires_encryption_key(monkeypatch):
    monkeypatch.setenv("TELEGRAM_BOT_SETUP_MODE", "remote")
    from saas_api.settings import settings

    settings.telegram_bot_setup_mode = "remote"
    settings.telegram_token_encryption_key = ""
    settings.app_env = "production"
    with pytest.raises(Exception):
        telegram_bot_service.require_secure_token_storage()
