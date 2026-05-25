import pytest

from backend_common.production_checks import (
    ProductionSettingsError,
    validate_integration_settings,
)


def test_production_rejects_mock_payment():
    with pytest.raises(ProductionSettingsError, match="PAYMENT_API_MODE=mock"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="mock",
            payment_api_base_url="",
            payment_api_token="",
            astro_api_mode="remote",
            astro_api_base_url="https://astro.example.com",
            astro_api_token="token",
        )


def test_production_rejects_mock_astro():
    with pytest.raises(ProductionSettingsError, match="ASTRO_API_MODE=mock"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="remote",
            payment_api_base_url="https://pay.example.com",
            payment_api_token="token",
            astro_api_mode="mock",
            astro_api_base_url="",
            astro_api_token="",
        )


def test_production_remote_requires_payment_token():
    with pytest.raises(ProductionSettingsError, match="PAYMENT_API_TOKEN"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="remote",
            payment_api_base_url="https://pay.example.com",
            payment_api_token="",
            astro_api_mode="remote",
            astro_api_base_url="https://astro.example.com",
            astro_api_token="token",
        )


def test_production_remote_requires_astro_token():
    with pytest.raises(ProductionSettingsError, match="ASTRO_API_TOKEN"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="remote",
            payment_api_base_url="https://pay.example.com",
            payment_api_token="token",
            astro_api_mode="remote",
            astro_api_base_url="https://astro.example.com",
            astro_api_token="",
        )


def test_staging_mock_requires_allow_flag():
    with pytest.raises(ProductionSettingsError, match="ALLOW_STAGING_MOCKS"):
        validate_integration_settings(
            app_env="staging",
            payment_api_mode="mock",
            payment_api_base_url="",
            payment_api_token="",
            astro_api_mode="remote",
            astro_api_base_url="https://astro.example.com",
            astro_api_token="token",
            allow_staging_mocks=False,
        )


def test_staging_mock_allowed_with_flag():
    validate_integration_settings(
        app_env="staging",
        payment_api_mode="mock",
        payment_api_base_url="",
        payment_api_token="",
        astro_api_mode="remote",
        astro_api_base_url="https://astro.example.com",
        astro_api_token="token",
        allow_staging_mocks=True,
    )


def test_development_allows_mock():
    validate_integration_settings(
        app_env="development",
        payment_api_mode="mock",
        payment_api_base_url="",
        payment_api_token="",
        astro_api_mode="mock",
        astro_api_base_url="",
        astro_api_token="",
    )
