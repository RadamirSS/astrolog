import io

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.analytics_event import AnalyticsEvent


def _login(client: TestClient, email: str, password: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    assert response.json()["ok"] is True


MINIMAL_PNG = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01"
    b"\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\nIDATx\x9cc\x00\x01"
    b"\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
)


def test_analytics_event_stored(client: TestClient, seeded_db: Session):
    response = client.post(
        "/api/analytics/events",
        json={
            "events": [
                {
                    "eventName": "miniapp_opened",
                    "tenantId": "tenant_mystic",
                    "tenantSlug": "mystic-dark",
                    "sessionId": "sess_1",
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["data"]["accepted"] is True
    count = seeded_db.query(AnalyticsEvent).count()
    assert count == 1


def test_analytics_tenant_slug_resolves(client: TestClient, seeded_db: Session):
    response = client.post(
        "/api/analytics/events",
        json={"events": [{"eventName": "product_clicked", "tenantSlug": "mystic-dark"}]},
    )
    assert response.status_code == 200
    event = seeded_db.query(AnalyticsEvent).first()
    assert event.tenant_id == "tenant_mystic"


def test_analytics_invalid_event_skipped(client: TestClient, seeded_db: Session):
    response = client.post(
        "/api/analytics/events",
        json={"events": [{"eventName": "unknown_event_xyz", "tenantId": "tenant_mystic"}]},
    )
    assert response.status_code == 200
    assert seeded_db.query(AnalyticsEvent).count() == 0


def test_dashboard_metrics_returns_counts(client: TestClient, seeded_db: Session):
    client.post(
        "/api/analytics/events",
        json={
            "events": [
                {"eventName": "miniapp_opened", "tenantId": "tenant_mystic"},
                {"eventName": "miniapp_opened", "tenantId": "tenant_mystic"},
                {"eventName": "birth_profile_submitted", "tenantId": "tenant_mystic"},
                {"eventName": "product_clicked", "tenantId": "tenant_mystic"},
            ]
        },
    )
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/dashboard/tenants/tenant_mystic/metrics?period=7d")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["visits"] == 2
    assert data["birthProfilesSubmitted"] == 1
    assert data["productClicks"] == 1
    assert "conversion" in data


def test_dashboard_metrics_tenant_isolation(client: TestClient):
    client.post(
        "/api/analytics/events",
        json={"events": [{"eventName": "miniapp_opened", "tenantId": "tenant_other"}]},
    )
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/dashboard/tenants/tenant_mystic/metrics")
    assert response.status_code == 200
    assert response.json()["data"]["visits"] == 0


def test_upload_valid_png(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(
        "/api/dashboard/tenants/tenant_mystic/media",
        files={"file": ("avatar.png", io.BytesIO(MINIMAL_PNG), "image/png")},
        data={"kind": "avatar"},
    )
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["kind"] == "avatar"
    assert data["publicUrl"].startswith("http")
    assert data["mimeType"] == "image/png"


def test_upload_rejects_unsupported_mime(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(
        "/api/dashboard/tenants/tenant_mystic/media",
        files={"file": ("bad.txt", io.BytesIO(b"hello"), "text/plain")},
        data={"kind": "avatar"},
    )
    assert response.status_code == 422


def test_upload_rejects_oversized_file(client: TestClient, monkeypatch):
    from saas_api import settings as settings_module

    monkeypatch.setattr(settings_module.settings, "media_max_upload_mb", 0)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(
        "/api/dashboard/tenants/tenant_mystic/media",
        files={"file": ("avatar.png", io.BytesIO(MINIMAL_PNG), "image/png")},
        data={"kind": "avatar"},
    )
    assert response.status_code == 422


def test_list_and_delete_media(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    upload = client.post(
        "/api/dashboard/tenants/tenant_mystic/media",
        files={"file": ("logo.png", io.BytesIO(MINIMAL_PNG), "image/png")},
        data={"kind": "logo"},
    )
    asset_id = upload.json()["data"]["id"]

    listed = client.get("/api/dashboard/tenants/tenant_mystic/media")
    assert listed.status_code == 200
    assert len(listed.json()["data"]) >= 1

    deleted = client.delete(f"/api/dashboard/tenants/tenant_mystic/media/{asset_id}")
    assert deleted.status_code == 200
    assert deleted.json()["data"]["deleted"] is True


def test_cross_tenant_media_blocked(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    upload = client.post(
        "/api/dashboard/tenants/tenant_mystic/media",
        files={"file": ("avatar.png", io.BytesIO(MINIMAL_PNG), "image/png")},
        data={"kind": "avatar"},
    )
    asset_id = upload.json()["data"]["id"]

    _login(client, "admin@example.com", "admin123!")
    response = client.delete(f"/api/dashboard/tenants/tenant_other/media/{asset_id}")
    assert response.status_code == 404


def test_tenant_health_requires_platform_role(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/admin/tenants/tenant_mystic/health")
    assert response.status_code == 403


def test_tenant_health_returns_expected_fields(client: TestClient):
    _login(client, "admin@example.com", "admin123!")
    response = client.get("/api/admin/tenants/tenant_mystic/health")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["tenantId"] == "tenant_mystic"
    assert "hasPublishedConfig" in data
    assert "recentAnalyticsCount" in data
    assert "integrationStatuses" in data
    assert "warnings" in data
    assert data["integrationStatuses"]["analytics"] == "active"


def test_audit_logs_require_platform_role(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/admin/audit-logs")
    assert response.status_code == 403


def test_audit_logs_list(client: TestClient):
    _login(client, "admin@example.com", "admin123!")
    response = client.get("/api/admin/audit-logs?tenantId=tenant_mystic&limit=10")
    assert response.status_code == 200
    assert isinstance(response.json()["data"], list)
