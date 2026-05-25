import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.entitlement import Entitlement
from saas_api.db.models.order import Order
from saas_api.services import payment_client
from saas_api.services.commerce_store import get_entitlement, get_order
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
    settings.telegram_bot_token = ""
    payment_client.MOCK_PAYMENTS.clear()
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


def _seed_entitlement_db(
    db: Session,
    *,
    user_id: str,
    report_id: str,
    status: str = "ready",
) -> tuple[str, str]:
    from datetime import UTC, datetime

    now = datetime.now(UTC)
    order_id = "ord_test_security"
    ent_id = "ent_test_security"
    db.merge(
        Order(
            id=order_id,
            tenant_id="tenant_mystic",
            end_user_id=user_id,
            session_id=user_id,
            product_type="main_natal_portrait",
            product_title="Полный астрологический портрет",
            amount=149,
            currency="USD",
            status="paid",
            payment_status="paid",
            report_status="ready" if status == "ready" else "generating",
            entitlement_id=ent_id,
            entitlement_status=status,
            external_report_id=report_id,
            created_at=now,
            updated_at=now,
            paid_at=now,
        )
    )
    db.merge(
        Entitlement(
            id=ent_id,
            tenant_id="tenant_mystic",
            end_user_id=user_id,
            session_id=user_id,
            order_id=order_id,
            product_type="main_natal_portrait",
            status=status,
            report_id=report_id,
            created_at=now,
            updated_at=now,
            granted_at=now,
        )
    )
    if status == "ready":
        from saas_api.services.commerce_store import upsert_paid_report

        upsert_paid_report(
            db,
            report_id=report_id,
            tenant_id="tenant_mystic",
            end_user_id=user_id,
            order_id=order_id,
            entitlement_id=ent_id,
            product_type="main_natal_portrait",
            theme="relationships",
            report_json={
                "schemaVersion": 2,
                "id": report_id,
                "productType": "main_natal_portrait",
                "level": "main",
                "theme": "relationships",
                "title": "Paid Report",
                "status": "ready",
                "sections": [],
                "createdAt": now.isoformat().replace("+00:00", "Z"),
                "updatedAt": now.isoformat().replace("+00:00", "Z"),
            },
        )
    db.commit()
    return order_id, ent_id


def test_entitlements_require_auth(client: TestClient):
    response = client.get("/api/me/entitlements?tenantId=tenant_mystic")
    assert response.status_code == 401


def test_spoofed_user_query_is_ignored(end_user_client: TestClient, seeded_db: Session):
    me = end_user_client.get("/api/me").json()["data"]
    report_id = "rep_other_user"
    _seed_entitlement_db(seeded_db, user_id="eu_spoof_target_not_me", report_id=report_id, status="ready")

    response = end_user_client.get(
        f"/api/me/entitlements?tenantId=tenant_mystic&userId=eu_spoof_target_not_me&sessionId=eu_spoof_target_not_me"
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data == []
    assert me["id"] != "eu_spoof_target_not_me"


def test_ready_entitlement_allows_access(end_user_client: TestClient, seeded_db: Session):
    me = end_user_client.get("/api/me").json()["data"]
    report_id = "rep_ready_user"
    _seed_entitlement_db(seeded_db, user_id=me["id"], report_id=report_id, status="ready")

    response = end_user_client.get(
        f"/api/me/reports/{report_id}/access?tenantId=tenant_mystic&userId=someone_else"
    )
    assert response.status_code == 200
    assert response.json()["data"]["allowed"] is True


def test_locked_entitlement_denies_access(end_user_client: TestClient, seeded_db: Session):
    me = end_user_client.get("/api/me").json()["data"]
    report_id = "rep_locked_user"
    _seed_entitlement_db(seeded_db, user_id=me["id"], report_id=report_id, status="paid_generating")

    response = end_user_client.get(
        f"/api/me/reports/{report_id}/access?tenantId=tenant_mystic"
    )
    assert response.status_code == 200
    assert response.json()["data"]["allowed"] is False


def test_revoked_entitlement_denies_access(end_user_client: TestClient, seeded_db: Session):
    me = end_user_client.get("/api/me").json()["data"]
    report_id = "rep_revoked_user"
    _seed_entitlement_db(seeded_db, user_id=me["id"], report_id=report_id, status="revoked")

    response = end_user_client.get(
        f"/api/me/reports/{report_id}/access?tenantId=tenant_mystic"
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["allowed"] is False
    assert "revoked" in (data.get("reason") or "").lower()
