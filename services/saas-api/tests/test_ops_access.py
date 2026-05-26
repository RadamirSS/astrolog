"""Dashboard ops order access control tests."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.services.seed_finance import seed_finance_demo


def _login(client: TestClient, email: str, password: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def _ops_url(path: str) -> str:
    return f"/api/dashboard/tenants/tenant_mystic/ops{path}"


def _seed_orders(seeded_db: Session) -> None:
    seed_finance_demo(seeded_db, "tenant_mystic")
    seeded_db.expire_all()


def test_creator_cannot_approve_mock_payment(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(_ops_url("/orders/ord_fin_seed_01/approve-mock-payment"))
    assert response.status_code == 403


def test_creator_cannot_unlock_entitlement(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(_ops_url("/orders/ord_fin_seed_01/entitlement/unlock"))
    assert response.status_code == 403


def test_creator_cannot_revoke_entitlement(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(_ops_url("/orders/ord_fin_seed_01/entitlement/revoke"))
    assert response.status_code == 403


def test_creator_cannot_access_another_partner_order(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/orders/ord_fin_seed_00"))
    assert response.status_code == 403


def test_creator_sees_only_own_tenant_orders(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/orders"))
    assert response.status_code == 200
    data = response.json()["data"]
    assert len(data) >= 1
    assert all(row["partnerId"] == "partner_nicole" for row in data)


def test_creator_cannot_list_all_tenant_orders_via_partner_filter(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/orders?partnerId=partner_luna"))
    assert response.status_code == 403


def test_creator_without_partner_id_denied_orders(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger-nopartner@example.com", "blogger123!")
    response = client.get(_ops_url("/orders"))
    assert response.status_code == 403


def test_platform_admin_can_perform_admin_ops(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "admin@example.com", "admin123!")
    list_response = client.get(_ops_url("/orders"))
    assert list_response.status_code == 200
    assert len(list_response.json()["data"]) >= 2

    order_response = client.get(_ops_url("/orders/ord_fin_seed_00"))
    assert order_response.status_code == 200

    unlock_response = client.post(_ops_url("/orders/ord_fin_seed_01/entitlement/unlock"))
    assert unlock_response.status_code == 200


def test_creator_can_view_own_order(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/orders/ord_fin_seed_01"))
    assert response.status_code == 200
    assert response.json()["data"]["partnerId"] == "partner_nicole"


def test_viewer_can_read_own_partner_orders(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "viewer@example.com", "viewer123!")
    response = client.get(_ops_url("/orders"))
    assert response.status_code == 200
    assert all(row["partnerId"] == "partner_nicole" for row in response.json()["data"])


def test_viewer_cannot_approve_mock_payment(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "viewer@example.com", "viewer123!")
    response = client.post(_ops_url("/orders/ord_fin_seed_01/approve-mock-payment"))
    assert response.status_code == 403


def test_creator_cannot_sync_another_partner_payment(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(_ops_url("/orders/ord_fin_seed_00/sync-payment"))
    assert response.status_code == 403


def test_creator_cannot_needs_review_another_partner_order(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(
        _ops_url("/orders/ord_fin_seed_00/set-needs-review"),
        json={"needsReview": True},
    )
    assert response.status_code == 403


def test_creator_can_needs_review_own_order(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.post(
        _ops_url("/orders/ord_fin_seed_01/set-needs-review"),
        json={"needsReview": True},
    )
    assert response.status_code == 200


def test_platform_admin_can_needs_review_any_order(client: TestClient, seeded_db: Session):
    _seed_orders(seeded_db)
    _login(client, "admin@example.com", "admin123!")
    response = client.post(
        _ops_url("/orders/ord_fin_seed_00/set-needs-review"),
        json={"needsReview": True},
    )
    assert response.status_code == 200
