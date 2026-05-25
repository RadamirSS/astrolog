import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.services import astro_client, payment_client
from saas_api.services.commerce_store import get_entitlement, get_order
from saas_api.services.order_lifecycle_service import sync_order_report
from saas_api.settings import settings

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)

CHECKOUT_PRODUCT = {
    "productId": "mystic-dark-full-natal-portrait",
    "productType": "main_natal_portrait",
    "productTitle": "Ignored Title",
    "amount": 0,
    "currency": "EUR",
}


@pytest.fixture(autouse=True)
def integration_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("PAYMENT_API_MODE", "mock")
    monkeypatch.setenv("ASTRO_API_MODE", "mock")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "")
    settings.app_env = "development"
    settings.payment_api_mode = "mock"
    settings.astro_api_mode = "mock"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    payment_client.MOCK_PAYMENTS.clear()
    astro_client.MOCK_ASTRO_REPORTS.clear()
    yield


@pytest.fixture()
def end_user_client(client: TestClient) -> TestClient:
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


def _start_checkout(client: TestClient) -> dict:
    response = client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            **CHECKOUT_PRODUCT,
            "theme": "relationships",
            "locale": "en",
            "birth": {
                "name": "Test User",
                "birthDate": "1990-01-01",
                "birthTime": "12:00",
                "timeAccuracy": "exact",
                "birthPlace": "Paris",
            },
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    return body["data"]


def test_success_return_without_verified_payment_does_not_mark_paid(end_user_client: TestClient):
    checkout = _start_checkout(end_user_client)
    response = end_user_client.post(
        f"/api/checkout/{checkout['orderId']}/confirm-return",
        json={"orderId": checkout["orderId"], "returnState": "success"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["orderStatus"] != "paid"
    assert data["paymentStatus"] != "paid"


def test_verified_paid_triggers_report_with_external_id(
    end_user_client: TestClient, seeded_db: Session
):
    checkout = _start_checkout(end_user_client)
    payment_client.payment_client.mock_mark_paid(checkout["paymentId"])
    response = end_user_client.post(
        f"/api/checkout/{checkout['orderId']}/confirm-return",
        json={"orderId": checkout["orderId"], "returnState": "success"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["orderStatus"] == "paid"
    assert data["paymentStatus"] == "paid"
    assert data["externalReportId"]

    async def wait_for_ready() -> None:
        for _ in range(10):
            await sync_order_report(seeded_db, "tenant_mystic", checkout["orderId"])
            seeded_db.expire_all()
            order = get_order(seeded_db, checkout["orderId"])
            assert order is not None
            if order.report_status == "ready":
                return
            await asyncio.sleep(0.1)
        raise AssertionError("Report did not become ready")

    asyncio.run(wait_for_ready())
    order = get_order(seeded_db, checkout["orderId"])
    assert order is not None
    assert order.external_report_id
    assert order.amount == 149.0
    assert order.currency == "USD"
    ent = get_entitlement(seeded_db, checkout["entitlementId"])
    assert ent is not None
    assert ent.status == "ready"


def test_failed_return_does_not_unlock(end_user_client: TestClient):
    checkout = _start_checkout(end_user_client)
    response = end_user_client.post(
        f"/api/checkout/{checkout['orderId']}/confirm-return",
        json={"orderId": checkout["orderId"], "returnState": "failed"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["orderStatus"] == "failed"
    assert data["entitlementStatus"] == "locked"


def test_cancel_return_locks_entitlement(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_checkout(end_user_client)
    response = end_user_client.post(
        f"/api/checkout/{checkout['orderId']}/confirm-return",
        json={"orderId": checkout["orderId"], "returnState": "cancel"},
    )
    assert response.status_code == 200
    ent = get_entitlement(seeded_db, checkout["entitlementId"])
    assert ent is not None
    assert ent.status == "locked"
