import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.services import payment_client
from saas_api.services.commerce_store import get_order, get_premium_request
from saas_api.settings import settings

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
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


def test_client_amount_zero_uses_catalog_price(end_user_client: TestClient, seeded_db: Session):
    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "mystic-dark-full-natal-portrait",
            "productType": "main_natal_portrait",
            "productTitle": "Fake",
            "amount": 0,
            "currency": "EUR",
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
    order = get_order(seeded_db, order_id)
    assert order is not None
    assert order.amount == 149.0
    assert order.currency == "USD"


def test_tenant_price_override_ignored(end_user_client: TestClient, seeded_db: Session):
    from saas_api.db.models.tenant_config import ConfigKind, TenantConfig

    row = (
        seeded_db.query(TenantConfig)
        .filter(
            TenantConfig.tenant_id == "tenant_mystic",
            TenantConfig.kind == ConfigKind.PUBLISHED,
        )
        .first()
    )
    assert row is not None
    config = dict(row.config_json)
    for product in config.get("products", []):
        if product.get("productType") == "main_natal_portrait":
            product["price"] = 1
            product["currency"] = "EUR"
    row.config_json = config
    seeded_db.commit()

    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "mystic-dark-full-natal-portrait",
            "productType": "main_natal_portrait",
        },
    )
    assert response.status_code == 200
    order_id = response.json()["data"]["orderId"]
    order = get_order(seeded_db, order_id)
    assert order is not None
    assert order.amount == 149.0
    assert order.currency == "USD"


def test_fake_product_type_rejected(end_user_client: TestClient):
    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "mystic-dark-full-natal-portrait",
            "productType": "fake_product_type",
            "productTitle": "Fake",
            "amount": 1,
            "currency": "USD",
        },
    )
    assert response.status_code == 400


def test_free_report_checkout_rejected(end_user_client: TestClient):
    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "mystic-dark-free-mini-report",
            "productType": "free_report",
            "productTitle": "Free",
            "amount": 0,
            "currency": "USD",
        },
    )
    assert response.status_code == 400


def test_unknown_product_id_rejected(end_user_client: TestClient):
    response = end_user_client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productId": "does-not-exist",
            "productType": "main_natal_portrait",
            "productTitle": "Fake",
            "amount": 149,
            "currency": "USD",
        },
    )
    assert response.status_code == 404


def test_premium_request_persists_in_db(end_user_client: TestClient, seeded_db: Session):
    response = end_user_client.post(
        "/api/me/premium-requests",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productTitle": "Premium-разбор",
            "topic": "money",
            "personalQuestion": "Persist me",
            "consentAccepted": True,
        },
    )
    assert response.status_code == 200
    req_id = response.json()["data"]["id"]
    seeded_db.expire_all()
    req = get_premium_request(seeded_db, req_id)
    assert req is not None
    assert req.personal_question == "Persist me"
