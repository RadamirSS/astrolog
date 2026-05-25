from fastapi.testclient import TestClient

from saas_api.main import app

client = TestClient(app)


def test_health_returns_ok_envelope():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "saas-api"
    assert body["data"]["status"] == "ok"
    assert "meta" in body
    assert body["meta"]["requestId"]
    assert body["meta"]["timestamp"]


def test_version_returns_version_envelope():
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "saas-api"
    assert body["data"]["version"] == "0.1.0"
    assert body["data"]["environment"] == "development"


def test_ready_returns_ready_envelope():
    response = client.get("/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "saas-api"
    assert body["data"]["status"] == "ready"
