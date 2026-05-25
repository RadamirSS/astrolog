from fastapi.testclient import TestClient

from astro_api.main import app

client = TestClient(app)


def test_health_returns_ok_envelope():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "astro-api"
    assert body["data"]["status"] == "ok"


def test_ready_returns_ready_envelope():
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "astro-api"
    assert body["data"]["status"] == "ready"
