from saas_api.services.creator_miniapp_service import _ensure_surfaces


def test_default_surfaces_telegram_disabled():
    mini_app = _ensure_surfaces({}, "demo")
    surfaces = mini_app["surfaces"]
    assert len(surfaces) == 3
    by_type = {s["type"]: s for s in surfaces}
    assert by_type["telegram_mini_app"]["status"] == "disabled"
    assert by_type["website"]["status"] == "draft"
    assert by_type["mobile_web"]["status"] == "draft"


def test_existing_surfaces_preserved():
    existing = {
        "surfaces": [
            {
                "id": "surface_telegram_mini_app",
                "type": "telegram_mini_app",
                "status": "draft",
                "publicUrl": "/b/demo",
                "previewUrl": "/b/demo?preview=draft",
                "configJson": {"botStatus": "not_connected"},
            }
        ]
    }
    result = _ensure_surfaces(existing, "demo")
    assert result["surfaces"] is existing["surfaces"]
