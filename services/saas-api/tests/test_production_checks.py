import pytest

from backend_common.production_checks import (
    DEFAULT_SESSION_SECRET,
    ProductionSettingsError,
    validate_saas_production_settings,
)

VALID_PRODUCTION_KWARGS = {
    "app_env": "production",
    "database_url": "postgresql+psycopg://u:p@localhost/db",
    "saas_session_secret": "strong-secret-value",
    "allow_dev_telegram_auth": False,
    "telegram_bot_token": "123:abc",
    "saas_cookie_secure": True,
    "cors_origins": ["https://app.example.com"],
}


def test_production_requires_database_url():
    with pytest.raises(ProductionSettingsError, match="DATABASE_URL"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "database_url": ""},
        )


def test_production_rejects_default_session_secret():
    with pytest.raises(ProductionSettingsError, match="SAAS_SESSION_SECRET"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "saas_session_secret": DEFAULT_SESSION_SECRET},
        )


def test_production_rejects_dev_telegram_auth():
    with pytest.raises(ProductionSettingsError, match="ALLOW_DEV_TELEGRAM_AUTH"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "allow_dev_telegram_auth": True},
        )


def test_production_requires_telegram_token():
    with pytest.raises(ProductionSettingsError, match="TELEGRAM_BOT_TOKEN"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "telegram_bot_token": ""},
        )


def test_production_requires_cookie_secure():
    with pytest.raises(ProductionSettingsError, match="SAAS_COOKIE_SECURE"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "saas_cookie_secure": False},
        )


def test_staging_rejects_wildcard_cors():
    with pytest.raises(ProductionSettingsError, match="CORS_ORIGINS"):
        validate_saas_production_settings(
            app_env="staging",
            database_url="postgresql+psycopg://u:p@localhost/db",
            saas_session_secret="strong-secret-value",
            allow_dev_telegram_auth=False,
            telegram_bot_token="",
            cors_origins=["*"],
        )


def test_production_rejects_wildcard_cors():
    with pytest.raises(ProductionSettingsError, match="CORS_ORIGINS"):
        validate_saas_production_settings(
            **{**VALID_PRODUCTION_KWARGS, "cors_origins": ["https://app.example.com", "*"]},
        )


def test_staging_allows_missing_telegram_token_with_warning(caplog):
    validate_saas_production_settings(
        app_env="staging",
        database_url="postgresql+psycopg://u:p@localhost/db",
        saas_session_secret="strong-secret-value",
        allow_dev_telegram_auth=False,
        telegram_bot_token="",
        cors_origins=["https://staging.example.com"],
    )
    assert "TELEGRAM_BOT_TOKEN is not set" in caplog.text


def test_development_skips_validation():
    validate_saas_production_settings(
        app_env="development",
        database_url="",
        saas_session_secret=DEFAULT_SESSION_SECRET,
        allow_dev_telegram_auth=True,
        telegram_bot_token="",
        saas_cookie_secure=False,
        cors_origins=["*"],
    )
