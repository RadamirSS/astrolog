"""Payout method API safety tests."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.payout_method import PayoutMethodRecord, PayoutMethodStatus


def _login(client: TestClient, email: str, password: str) -> None:
    response = client.post("/auth/login", json={"email": email, "password": password})
    assert response.status_code == 200


def test_payout_methods_api_hides_external_token(client: TestClient, seeded_db: Session):
    seeded_db.add(
        PayoutMethodRecord(
            id="pm_api_test",
            tenant_id="tenant_mystic",
            partner_id="partner_nicole",
            type="manual",
            status=PayoutMethodStatus.VERIFIED,
            display_name="Manual payout",
            masked_details="****5678",
            external_token="super-secret-token",
            admin_note="Pilot manual only",
            created_at=datetime.now(UTC),
        )
    )
    seeded_db.commit()

    _login(client, "blogger@example.com", "blogger123!")
    response = client.get("/api/dashboard/tenants/tenant_mystic/ops/payout-methods")
    assert response.status_code == 200
    payload = response.json()["data"]
    assert len(payload) >= 1
    assert "external_token" not in str(payload)
    assert "externalToken" not in str(payload)
    assert payload[0]["maskedDetails"] == "****5678"
