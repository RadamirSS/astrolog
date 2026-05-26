from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.tenant_config import ConfigKind, TenantConfig


def test_public_partner_resolves_active(client: TestClient):
    response = client.get("/api/public/partners/nicole")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["partnerSlug"] == "nicole"
    assert data["tenantSlug"] == "mystic-dark"
    assert data["status"] == "published"
    assert data["miniAppName"]
    assert data["heroTitle"]
    assert data["publicLinks"]["money"] == "/b/nicole/money"
    assert len(data["activeProducts"]) >= 1
    assert "contact" not in data
    assert "commissionRate" not in data
    assert "balance" not in data
    assert "payout" not in str(data).lower() or "payout" not in data


def test_public_partner_not_found(client: TestClient):
    response = client.get("/api/public/partners/does-not-exist")
    assert response.status_code == 404


def test_public_partner_paused_unavailable(client: TestClient, seeded_db: Session):
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
    config["miniApp"] = {
        **(config.get("miniApp") or {}),
        "publicSlug": "paused-slug",
        "publicStatus": "paused",
        "partnerStatus": "active",
    }
    row.config_json = config
    seeded_db.commit()

    response = client.get("/api/public/partners/paused-slug")
    assert response.status_code == 403


def test_public_partner_topic_links(client: TestClient):
    response = client.get("/api/public/partners/nicole")
    assert response.status_code == 200
    links = response.json()["data"]["publicLinks"]
    assert links["relationships"] == "/b/nicole/relationships"
    assert links["personality"] == "/b/nicole/personality"


def test_public_miniapps_alias_resolves(client: TestClient):
    response = client.get("/api/public/miniapps/nicole")
    assert response.status_code == 200
    assert response.json()["data"]["partnerSlug"] == "nicole"


def test_public_partner_draft_unavailable(client: TestClient, seeded_db: Session):
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
    config["miniApp"] = {
        **(config.get("miniApp") or {}),
        "publicSlug": "draft-only-slug",
        "publicStatus": "draft",
        "partnerStatus": "active",
    }
    row.config_json = config
    seeded_db.commit()

    response = client.get("/api/public/partners/draft-only-slug")
    assert response.status_code == 403
