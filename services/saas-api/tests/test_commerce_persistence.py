import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from backend_common.production_checks import ProductionSettingsError, validate_integration_settings
from saas_api.services import payment_client
from saas_api.services.commerce_store import get_entitlement, get_order
from saas_api.settings import settings

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)


def test_production_rejects_mock_payment_mode():
    with pytest.raises(ProductionSettingsError, match="PAYMENT_API_MODE=mock"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="mock",
            payment_api_base_url="",
            payment_api_token="",
            astro_api_mode="remote",
            astro_api_base_url="http://astro",
            astro_api_token="",
        )


def test_production_requires_remote_payment_config():
    with pytest.raises(ProductionSettingsError, match="PAYMENT_API_BASE_URL"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="remote",
            payment_api_base_url="",
            payment_api_token="token",
            astro_api_mode="remote",
            astro_api_base_url="http://astro",
            astro_api_token="",
        )


def test_development_allows_mock_mode():
    validate_integration_settings(
        app_env="development",
        payment_api_mode="mock",
        payment_api_base_url="",
        payment_api_token="",
        astro_api_mode="mock",
        astro_api_base_url="",
        astro_api_token="",
    )


@pytest.fixture(autouse=True)
def integration_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("PAYMENT_API_MODE", "mock")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    settings.app_env = "development"
    settings.payment_api_mode = "mock"
    settings.allow_dev_telegram_auth = True
    payment_client.MOCK_PAYMENTS.clear()
    yield


@pytest.fixture()
def end_user_client(client: TestClient) -> TestClient:
    settings.allow_dev_telegram_auth = True
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


def test_order_persists_after_lookup(end_user_client: TestClient, seeded_db: Session):
    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "mystic-dark-relationships-code",
            "productType": "low_ticket_relationships",
            "productTitle": "ignored",
            "amount": 0,
            "currency": "USD",
            "birth": {
                "name": "Test",
                "birthDate": "1990-01-01",
                "birthTime": "12:00",
                "timeAccuracy": "exact",
                "birthPlace": "Paris",
            },
        },
    )
    assert response.status_code == 200
    order_id = response.json()["data"]["orderId"]
    entitlement_id = response.json()["data"]["entitlementId"]

    seeded_db.expire_all()
    order = get_order(seeded_db, order_id)
    ent = get_entitlement(seeded_db, entitlement_id)
    assert order is not None
    assert ent is not None
    assert order.amount == 29.0
    assert order.product_type == "low_ticket_relationships"
