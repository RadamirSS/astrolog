"""Finance API access control tests."""

from __future__ import annotations

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.payout import Payout, PayoutStatus
from saas_api.services.seed_finance import seed_finance_demo


def _login(client: TestClient, email: str, password: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def _ops_url(path: str) -> str:
    return f"/api/dashboard/tenants/tenant_mystic/ops{path}"


def _seed_finance(seeded_db: Session) -> None:
    seed_finance_demo(seeded_db, "tenant_mystic")
    seeded_db.expire_all()


def _draft_payout_id(seeded_db: Session) -> str:
    payout = (
        seeded_db.query(Payout)
        .filter(
            Payout.tenant_id == "tenant_mystic",
            Payout.status == PayoutStatus.DRAFT,
        )
        .first()
    )
    assert payout is not None
    return payout.id


def test_platform_admin_can_list_all_balances(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "admin@example.com", "admin123!")
    response = client.get(_ops_url("/balances"))
    assert response.status_code == 200
    assert len(response.json()["data"]) >= 1


def test_creator_owner_sees_only_own_balance(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/balances"))
    assert response.status_code == 200
    data = response.json()["data"]
    assert all(row["partnerId"] == "partner_nicole" for row in data)


def test_creator_cannot_see_another_partner_balance(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/balances/partner_luna"))
    assert response.status_code == 403


def test_creator_without_partner_id_denied_finance(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger-nopartner@example.com", "blogger123!")
    response = client.get(_ops_url("/balances"))
    assert response.status_code == 403


def test_viewer_can_read_own_balance(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "viewer@example.com", "viewer123!")
    response = client.get(_ops_url("/balances"))
    assert response.status_code == 200


def test_viewer_cannot_approve_payout(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    payout_id = _draft_payout_id(seeded_db)
    _login(client, "viewer@example.com", "viewer123!")
    response = client.patch(_ops_url(f"/payouts/{payout_id}"), json={"action": "approve"})
    assert response.status_code == 403


def test_creator_cannot_approve_payout(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    payout_id = _draft_payout_id(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.patch(_ops_url(f"/payouts/{payout_id}"), json={"action": "approve"})
    assert response.status_code == 403


def test_creator_cannot_mark_payout_paid(client: TestClient, seeded_db: Session):
    from saas_api.services.finance_service import approve_payout, create_payout_draft, release_commission_to_available
    from saas_api.db.models.commission import Commission

    _seed_finance(seeded_db)
    commission = (
        seeded_db.query(Commission)
        .filter(Commission.partner_id == "partner_nicole", Commission.status == "pending")
        .first()
    )
    if commission:
        release_commission_to_available(
            seeded_db,
            commission.id,
            admin_account_id="account_admin",
            tenant_id="tenant_mystic",
        )
        seeded_db.commit()
    draft = create_payout_draft(
        seeded_db,
        "tenant_mystic",
        "partner_nicole",
        10.0,
        "USD",
        admin_account_id="account_admin",
    )
    approved = approve_payout(
        seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic"
    )
    seeded_db.commit()
    _login(client, "blogger@example.com", "blogger123!")
    response = client.patch(_ops_url(f"/payouts/{approved['id']}"), json={"action": "paid"})
    assert response.status_code == 403


def test_platform_admin_can_approve_payout(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    payout_id = _draft_payout_id(seeded_db)
    _login(client, "admin@example.com", "admin123!")
    response = client.patch(_ops_url(f"/payouts/{payout_id}"), json={"action": "approve"})
    assert response.status_code == 200


def test_creator_cannot_access_ledger(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/ledger"))
    assert response.status_code == 403


def test_creator_cannot_access_product_economics(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/product-economics"))
    assert response.status_code == 403


def test_creator_cannot_release_commission(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    commissions = client.get(_ops_url("/commissions")).json()["data"]
    assert commissions
    response = client.post(_ops_url(f"/commissions/{commissions[0]['id']}/release"))
    assert response.status_code == 403


def test_platform_admin_account_can_list_payments(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "platform-admin@example.com", "platformadmin123!")
    response = client.get(_ops_url("/payments"))
    assert response.status_code == 200


def test_creator_scoped_partner_query_mismatch_denied(client: TestClient, seeded_db: Session):
    _seed_finance(seeded_db)
    _login(client, "blogger@example.com", "blogger123!")
    response = client.get(_ops_url("/commissions?partnerId=partner_luna"))
    assert response.status_code == 403
