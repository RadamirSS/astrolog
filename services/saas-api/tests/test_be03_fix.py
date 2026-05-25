"""BE-03-FIX: runtime security and contract alignment tests."""

from datetime import UTC, datetime

import pytest
from fastapi.testclient import TestClient

from saas_api.auth.passwords import new_id
from saas_api.db.models.tenant import Tenant, TenantStatus
from saas_api.db.models.tenant_config import ConfigKind, TenantConfig
from saas_api.services.seed_builder import build_mystic_config, publish_config_copy

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)


@pytest.fixture()
def end_user_client(client: TestClient, monkeypatch) -> TestClient:
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    from saas_api.settings import settings

    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""

    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


@pytest.fixture()
def draft_tenant(seeded_db):
    now = datetime.now(UTC)
    tenant = Tenant(
        id="tenant_draft",
        slug="draft-tenant",
        status=TenantStatus.DRAFT,
        created_by_account_id="account_admin",
        created_at=now,
        updated_at=now,
    )
    seeded_db.add(tenant)
    draft = build_mystic_config()
    published = publish_config_copy(draft)
    seeded_db.add_all(
        [
            TenantConfig(
                id=new_id("cfg"),
                tenant_id=tenant.id,
                kind=ConfigKind.DRAFT,
                version=1,
                config_json=draft,
                created_at=now,
                updated_at=now,
            ),
            TenantConfig(
                id=new_id("cfg"),
                tenant_id=tenant.id,
                kind=ConfigKind.PUBLISHED,
                version=1,
                config_json=published,
                created_at=now,
                updated_at=now,
                published_at=now,
            ),
        ]
    )
    seeded_db.commit()
    return tenant


def test_alembic_env_imports_be03_models():
    env_path = (
        __import__("pathlib").Path(__file__).resolve().parents[1] / "alembic" / "env.py"
    )
    content = env_path.read_text(encoding="utf-8")
    assert "EndUser" in content
    assert "BirthProfile" in content
    assert "Report" in content


def test_draft_tenant_public_config_blocked(client: TestClient, draft_tenant):
    response = client.get("/api/tenant/draft-tenant/config")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"
    assert "not published" in response.json()["error"]["message"].lower()


def test_draft_tenant_telegram_validation_blocked(
    client: TestClient, draft_tenant, monkeypatch
):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    from saas_api.settings import settings

    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True

    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "draft-tenant", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "FORBIDDEN"


def test_active_tenant_public_config_works(client: TestClient):
    response = client.get("/api/tenant/mystic-dark/config/published")
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_paused_tenant_still_returns_tenant_paused(client: TestClient, seeded_db):
    tenant = seeded_db.query(Tenant).filter_by(slug="mystic-dark").first()
    tenant.status = TenantStatus.PAUSED
    seeded_db.commit()

    response = client.get("/api/tenant/mystic-dark/config")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "TENANT_PAUSED"


def test_get_report_pending_returns_status_object(
    client: TestClient, end_user_client, seeded_db, monkeypatch
):
    from saas_api.auth.passwords import new_id
    from saas_api.db.models.end_user import EndUser
    from saas_api.db.models.report import Report, ReportStatus

    end_user = seeded_db.query(EndUser).first()
    now = datetime.now(UTC)
    report = Report(
        id=new_id("rep"),
        tenant_id=end_user.tenant_id,
        end_user_id=end_user.id,
        birth_profile_id=None,
        report_type="free",
        status=ReportStatus.PENDING,
        locale="en",
        request_json={"tenantSlug": "mystic-dark"},
        created_at=now,
        updated_at=now,
    )
    seeded_db.add(report)
    seeded_db.commit()

    response = end_user_client.get(f"/api/reports/{report.id}")
    assert response.status_code == 200
    body = response.json()["data"]
    assert body["status"] == "pending"
    assert "title" not in body
