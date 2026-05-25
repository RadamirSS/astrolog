import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.premium_request import PremiumRequest
from saas_api.services.commerce_store import get_premium_request
from saas_api.settings import settings

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)


@pytest.fixture(autouse=True)
def integration_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "")
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    yield


@pytest.fixture()
def end_user_client(client: TestClient) -> TestClient:
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


def test_create_and_list_premium_request(end_user_client: TestClient, seeded_db: Session):
    body = {
        "tenantId": "tenant_mystic",
        "tenantSlug": "mystic-dark",
        "productTitle": "Premium-разбор",
        "topic": "money",
        "personalQuestion": "Test question for pilot?",
        "consentAccepted": True,
    }
    created = end_user_client.post("/api/me/premium-requests", json=body)
    assert created.status_code == 200
    req_id = created.json()["data"]["id"]

    listed = end_user_client.get("/api/me/premium-requests?tenantId=tenant_mystic")
    assert listed.status_code == 200
    ids = [r["id"] for r in listed.json()["data"]]
    assert req_id in ids

    persisted = get_premium_request(seeded_db, req_id)
    assert persisted is not None
    assert persisted.personal_question == "Test question for pilot?"


def test_spoofed_user_query_ignored_on_premium_list(end_user_client: TestClient):
    end_user_client.post(
        "/api/me/premium-requests",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            "productTitle": "Premium",
            "topic": "other",
            "personalQuestion": "Own request only",
            "consentAccepted": True,
        },
    )
    spoofed = end_user_client.get(
        "/api/me/premium-requests?tenantId=tenant_mystic&userId=other_user_999"
    )
    assert spoofed.status_code == 200
    for item in spoofed.json()["data"]:
        assert item.get("userId") != "other_user_999"
