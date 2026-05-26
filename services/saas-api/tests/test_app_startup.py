from saas_api.main import create_app


def test_create_app_succeeds_without_name_error():
    app = create_app()
    assert app is not None


def test_dashboard_router_included():
    app = create_app()
    paths = {route.path for route in app.routes if hasattr(route, "path")}
    assert "/api/dashboard/tenants" in paths
