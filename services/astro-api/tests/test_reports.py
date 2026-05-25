from fastapi.testclient import TestClient

from astro_api.main import app

client = TestClient(app)

SAMPLE_REQUEST = {
    "tenantId": "tenant_mystic",
    "tenantSlug": "mystic-dark",
    "locale": "en",
    "reportType": "free_natal",
    "birthProfile": {
        "name": "Anna",
        "birthDate": "1998-06-16",
        "birthTime": "14:30",
        "birthCity": "Milan",
        "topic": "relationships",
    },
    "styleProfile": {
        "tone": "mystic-dark",
        "brandVoice": "premium, warm, practical",
    },
}


def test_health_returns_ok_envelope():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "astro-api"
    assert body["data"]["status"] == "ok"


def test_version_returns_version_envelope():
    response = client.get("/version")
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    assert body["data"]["service"] == "astro-api"
    assert body["data"]["version"] == "0.1.0"


def test_free_report_returns_structured_report_en():
    response = client.post("/v1/reports/free", json=SAMPLE_REQUEST)
    assert response.status_code == 200
    body = response.json()
    assert body["ok"] is True
    report = body["data"]
    assert report["id"].startswith("report_stub_")
    assert report["type"] == "natal"
    assert report["title"] == "Your Mini Report Is Ready"
    assert report["highlights"]
    assert report["sections"]
    assert report["generatedAt"]
    assert "relationships" in report["summary"]


def test_free_report_returns_russian_text():
    payload = {**SAMPLE_REQUEST, "locale": "ru"}
    response = client.post("/v1/reports/free", json=payload)
    assert response.status_code == 200
    report = response.json()["data"]
    assert report["title"] == "Ваш мини-разбор готов"
    assert "отношения" in report["summary"]


def test_free_report_unsupported_locale_falls_back_to_en():
    payload = {**SAMPLE_REQUEST, "locale": "fr"}
    response = client.post("/v1/reports/free", json=payload)
    assert response.status_code == 200
    report = response.json()["data"]
    assert report["title"] == "Your Mini Report Is Ready"


def test_free_report_validation_error():
    response = client.post("/v1/reports/free", json={"tenantId": "tenant_mystic"})
    assert response.status_code == 422
    body = response.json()
    assert body["ok"] is False
    assert body["error"]["code"] == "VALIDATION_ERROR"
