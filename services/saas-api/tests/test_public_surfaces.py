from fastapi.testclient import TestClient


def test_public_surface_website_resolves(client: TestClient):
    response = client.get("/api/public/surfaces/website/nicole")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["slug"] == "nicole"
    assert data["surfaceType"] == "website"
    assert "token" not in data
    assert "commissionRate" not in data


def test_public_surface_mobile_resolves(client: TestClient):
    response = client.get("/api/public/surfaces/mobile/nicole")
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["surfaceType"] == "mobile_web"
    assert data.get("bottomNavEnabled") is True


def test_public_surface_telegram_alias(client: TestClient):
    response = client.get("/api/public/surfaces/telegram/nicole")
    assert response.status_code == 200
    assert response.json()["data"]["surfaceType"] == "telegram_mini_app"


def test_public_surface_draft_unavailable(client: TestClient):
    response = client.get("/api/public/surfaces/website/does-not-exist")
    assert response.status_code == 404
