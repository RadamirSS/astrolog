from fastapi.testclient import TestClient


def _login(client: TestClient, email: str, password: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200
    assert response.json()["ok"] is True


def test_health_returns_ok_envelope(client: TestClient):
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "saas-api"
    assert body["data"]["status"] == "ok"


def test_version_returns_version_envelope(client: TestClient):
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "saas-api"


def test_login_success(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "admin123!"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["account"]["role"] == "platform_owner"
    assert "saas_session" in response.cookies


def test_login_failure(client: TestClient):
    response = client.post(
        "/auth/login",
        json={"email": "admin@example.com", "password": "wrong"},
    )
    assert response.status_code == 401
    assert response.json()["ok"] is False
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


def test_auth_me_unauthenticated(client: TestClient):
    response = client.get("/auth/me")
    assert response.status_code == 401


def test_auth_me_authenticated(client: TestClient):
    _login(client, "admin@example.com", "admin123!")
    response = client.get("/auth/me")
    assert response.status_code == 200
    assert response.json()["data"]["email"] == "admin@example.com"


def test_platform_owner_lists_all_tenants(client: TestClient):
    _login(client, "admin@example.com", "admin123!")
    response = client.get("/api/dashboard/tenants")
    assert response.status_code == 200
    tenants = response.json()["data"]
    assert len(tenants) == 2
    slugs = {t["slug"] for t in tenants}
    assert "mystic-dark" in slugs
    assert "other-tenant" in slugs


def test_blogger_sees_only_assigned_tenants(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/dashboard/tenants")
    assert response.status_code == 200
    tenants = response.json()["data"]
    assert len(tenants) == 1
    assert tenants[0]["slug"] == "mystic-dark"


def test_get_draft_config(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/dashboard/tenants/tenant_mystic/config/draft")
    assert response.status_code == 200
    config = response.json()["data"]
    assert config["tenantId"] == "tenant_mystic"
    assert config["slug"] == "mystic-dark"


def test_save_valid_draft_config(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    draft = client.get("/api/dashboard/tenants/tenant_mystic/config/draft").json()["data"]
    draft["brand"]["tagline"] = "Updated tagline"
    response = client.put("/api/dashboard/tenants/tenant_mystic/config/draft", json=draft)
    assert response.status_code == 200
    assert response.json()["data"]["brand"]["tagline"] == "Updated tagline"


def test_reject_invalid_draft_config(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    draft = client.get("/api/dashboard/tenants/tenant_mystic/config/draft").json()["data"]
    draft["brand"]["displayName"] = ""
    response = client.put("/api/dashboard/tenants/tenant_mystic/config/draft", json=draft)
    assert response.status_code == 400
    assert response.json()["error"]["code"] == "CONFIG_INVALID"


def test_publish_config(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    draft = client.get("/api/dashboard/tenants/tenant_mystic/config/draft").json()["data"]
    draft["content"]["home"]["headline"] = "Published headline"
    client.put("/api/dashboard/tenants/tenant_mystic/config/draft", json=draft)
    response = client.post("/api/dashboard/tenants/tenant_mystic/publish")
    assert response.status_code == 200
    published = response.json()["data"]
    assert published["content"]["home"]["headline"] == "Published headline"
    assert published.get("publishedAt")


def test_discard_draft(client: TestClient):
    _login(client, "blogger@example.com", "blogger123!")
    draft = client.get("/api/dashboard/tenants/tenant_mystic/config/draft").json()["data"]
    draft["content"]["home"]["headline"] = "Temporary change"
    client.put("/api/dashboard/tenants/tenant_mystic/config/draft", json=draft)
    response = client.post("/api/dashboard/tenants/tenant_mystic/discard-draft")
    assert response.status_code == 200
    assert response.json()["data"]["content"]["home"]["headline"] != "Temporary change"


def test_public_published_config_by_slug(client: TestClient):
    response = client.get("/api/tenant/mystic-dark/config")
    assert response.status_code == 200
    assert response.json()["data"]["slug"] == "mystic-dark"


def test_paused_tenant_returns_tenant_paused(client: TestClient, seeded_db):
    from saas_api.db.models.tenant import Tenant, TenantStatus

    tenant = seeded_db.get(Tenant, "tenant_mystic")
    tenant.status = TenantStatus.PAUSED
    seeded_db.commit()
    response = client.get("/api/tenant/mystic-dark/config")
    assert response.status_code == 403
    assert response.json()["error"]["code"] == "TENANT_PAUSED"
