"""Payout method serialization safety tests."""

from datetime import UTC, datetime

from saas_api.db.models.payout_method import PayoutMethodRecord, PayoutMethodStatus
from saas_api.services.finance_store import payout_method_to_dict


def test_payout_method_to_dict_hides_external_token():
    record = PayoutMethodRecord(
        id="pm_test_1",
        tenant_id="tenant_mystic",
        partner_id="partner_nicole",
        type="manual",
        status=PayoutMethodStatus.VERIFIED,
        display_name="Manual payout",
        masked_details="****1234",
        external_token="secret-provider-token",
        admin_note="Pilot manual only",
        created_at=datetime.now(UTC),
    )
    payload = payout_method_to_dict(record)
    assert "external_token" not in payload
    assert "externalToken" not in payload
    assert payload["maskedDetails"] == "****1234"
    assert payload["displayName"] == "Manual payout"
