import pytest
from fastapi.testclient import TestClient

from saas_api.auth.telegram import build_test_init_data, validate_telegram_init_data
from saas_api.db.models.end_user import EndUser
from saas_api.db.models.report import Report, ReportStatus
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.services.astro_client import AstroClientError
from saas_api.settings import settings


DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)

SAMPLE_REPORT = {
    "schemaVersion": 2,
    "id": "report_test_001",
    "productType": "free_report",
    "level": "free",
    "theme": "personality",
    "title": "Test Report",
    "subtitle": "Test subtitle",
    "visualPack": "cosmic_pastel",
    "status": "ready",
    "sections": [
        {
            "id": "s1",
            "type": "summary",
            "title": "Overview",
            "content": "Content",
            "order": 0,
        }
    ],
    "actions": [],
    "pdfUrl": None,
    "createdAt": "2026-01-01T00:00:00Z",
    "updatedAt": "2026-01-01T00:00:00Z",
}


@pytest.fixture()
def dev_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "")
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    yield
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = False
    settings.telegram_bot_token = ""


@pytest.fixture()
def prod_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "production")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "false")
    monkeypatch.setenv("TELEGRAM_BOT_TOKEN", "prod-bot-token")
    monkeypatch.setenv("SAAS_COOKIE_SECURE", "true")
    monkeypatch.setenv("SAAS_SESSION_SECRET", "test-secret")
    settings.app_env = "production"
    settings.allow_dev_telegram_auth = False
    settings.telegram_bot_token = "prod-bot-token"
    settings.saas_cookie_secure = True
    settings.saas_session_secret = "test-secret"
    yield
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = False
    settings.telegram_bot_token = ""
    settings.saas_cookie_secure = False
    settings.saas_session_secret = "test-secret"


@pytest.fixture()
def end_user_client(client: TestClient, dev_settings) -> TestClient:
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


@pytest.fixture()
def mock_astro_success(monkeypatch):
    def _mock(payload):
        return SAMPLE_REPORT

    monkeypatch.setattr("saas_api.services.report_service.generate_free_report", _mock)
    return _mock


@pytest.fixture()
def mock_astro_failure(monkeypatch):
    def _mock(payload):
        raise AstroClientError("REPORT_GENERATION_FAILED", "Astro failed")

    monkeypatch.setattr("saas_api.services.report_service.generate_free_report", _mock)
    return _mock


def test_telegram_hmac_validation_unit():
    bot_token = "123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
    user = {"id": 123456789, "first_name": "Test", "username": "testuser"}
    init_data = build_test_init_data(bot_token, user)
    previous_env = settings.app_env
    previous_dev_auth = settings.allow_dev_telegram_auth
    previous_token = settings.telegram_bot_token
    settings.telegram_bot_token = bot_token
    settings.app_env = "production"
    settings.allow_dev_telegram_auth = False
    try:
        result = validate_telegram_init_data(init_data)
        assert result.telegram_id == "123456789"
        assert result.first_name == "Test"
    finally:
        settings.app_env = previous_env
        settings.allow_dev_telegram_auth = previous_dev_auth
        settings.telegram_bot_token = previous_token


def test_telegram_rejects_invalid_init_data_production(client: TestClient, prod_settings):
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": "invalid=1&hash=bad"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_telegram_dev_fallback(client: TestClient, dev_settings, seeded_db):
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["user"]["telegramId"] == "123456789"
    end_user = seeded_db.query(EndUser).filter(EndUser.telegram_id == "123456789").first()
    assert end_user is not None
    assert end_user.first_name == "Dev"


def test_get_me_requires_session(client: TestClient, dev_settings):
    response = client.get("/api/me")
    assert response.status_code == 401


def test_get_me_returns_user(end_user_client: TestClient):
    response = end_user_client.get("/api/me")
    assert response.status_code == 200
    assert response.json()["data"]["telegramId"] == "123456789"


def test_birth_profile_save_and_get(end_user_client: TestClient):
    payload = {
        "name": "Anna",
        "birthDate": "1998-06-16",
        "birthTime": "14:30",
        "birthCity": "Milan",
        "topic": "relationships",
        "locale": "en",
    }
    save = end_user_client.post("/api/me/birth-profile", json=payload)
    assert save.status_code == 200
    data = save.json()["data"]
    assert data["name"] == "Anna"
    assert data["birthPlace"] == "Milan"

    get_resp = end_user_client.get("/api/me/birth-profile")
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["topic"] == "relationships"


def test_free_report_pipeline_success(end_user_client: TestClient, mock_astro_success, seeded_db):
    end_user_client.post(
        "/api/me/birth-profile",
        json={
            "name": "Anna",
            "birthDate": "1998-06-16",
            "birthCity": "Milan",
            "topic": "relationships",
            "locale": "en",
        },
    )
    response = end_user_client.post(
        "/api/reports/free",
        json={
            "tenantSlug": "mystic-dark",
            "locale": "en",
            "birthProfile": {
                "name": "Anna",
                "birthDate": "1998-06-16",
                "birthCity": "Milan",
                "topic": "relationships",
                "locale": "en",
            },
        },
    )
    assert response.status_code == 200
    report = response.json()["data"]
    assert report["title"] == "Test Report"

    stored = seeded_db.query(Report).filter(Report.status == ReportStatus.COMPLETED).first()
    assert stored is not None
    assert stored.report_json["id"] == "report_test_001"


def test_free_report_astro_failure(end_user_client: TestClient, mock_astro_failure, seeded_db):
    response = end_user_client.post(
        "/api/reports/free",
        json={
            "tenantSlug": "mystic-dark",
            "locale": "en",
            "birthProfile": {
                "name": "Anna",
                "birthDate": "1998-06-16",
                "birthCity": "Milan",
                "topic": "relationships",
                "locale": "en",
            },
        },
    )
    assert response.status_code == 502
    assert response.json()["error"]["code"] == "REPORT_GENERATION_FAILED"
    failed = seeded_db.query(Report).filter(Report.status == ReportStatus.FAILED).first()
    assert failed is not None
    assert failed.error_code == "REPORT_GENERATION_FAILED"


def test_report_history(end_user_client: TestClient, mock_astro_success):
    end_user_client.post(
        "/api/reports/free",
        json={
            "tenantSlug": "mystic-dark",
            "locale": "en",
            "birthProfile": {
                "name": "Anna",
                "birthDate": "1998-06-16",
                "birthCity": "Milan",
                "topic": "relationships",
                "locale": "en",
            },
        },
    )
    response = end_user_client.get("/api/reports")
    assert response.status_code == 200
    items = response.json()["data"]
    assert len(items) >= 1
    assert items[0]["title"] == "Test Report"


def test_user_cannot_access_other_users_report(
    client: TestClient, dev_settings, mock_astro_success, seeded_db
):
    client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    create = client.post(
        "/api/reports/free",
        json={
            "tenantSlug": "mystic-dark",
            "locale": "en",
            "birthProfile": {
                "name": "Anna",
                "birthDate": "1998-06-16",
                "birthCity": "Milan",
                "topic": "relationships",
                "locale": "en",
            },
        },
    )
    report_id = seeded_db.query(Report).first().id

    other_init = (
        "dev_mode=1&dev_user_id=987654321&dev_first_name=Other&dev_language_code=en"
    )
    client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": other_init},
    )
    denied = client.get(f"/api/reports/{report_id}")
    assert denied.status_code == 404


def test_paused_tenant_blocks_runtime(client: TestClient, dev_settings, seeded_db):
    tenant = seeded_db.query(Tenant).filter_by(slug="mystic-dark").first()
    tenant.status = TenantStatus.PAUSED
    seeded_db.commit()

    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "TENANT_PAUSED"


def test_public_published_config_still_works(client: TestClient, seeded_db):
    response = client.get("/api/tenant/mystic-dark/config/published")
    assert response.status_code == 200
    assert response.json()["ok"] is True
