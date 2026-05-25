"""Finance lifecycle tests: payment, commission, ledger, balance, payout."""

from __future__ import annotations

import asyncio

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from saas_api.db.models.account import Account, AccountRole
from saas_api.db.models.commission import Commission
from saas_api.db.models.ledger_entry import LedgerEntry
from saas_api.db.models.partner_balance import PartnerBalance
from saas_api.db.models.payment import Payment
from saas_api.db.models.payout import Payout
from saas_api.services import payment_client
from saas_api.services.commerce_store import get_order
from saas_api.services.finance_service import (
    approve_payout,
    create_payout_draft,
    mark_payment_refunded,
    mark_payout_paid,
    release_commission_to_available,
)
from saas_api.services.order_lifecycle_service import sync_order_payment
from saas_api.settings import settings

DEV_INIT_DATA = (
    "dev_mode=1&dev_user_id=123456789&dev_first_name=Dev"
    "&dev_last_name=User&dev_username=devuser&dev_language_code=en"
)

CHECKOUT_WITH_PARTNER = {
    "productId": "mystic-dark-money-code",
    "productType": "low_ticket_money",
    "amount": 0,
    "currency": "EUR",
    "partner": {"partnerId": "partner_luna", "partnerSlug": "luna-guide"},
}


@pytest.fixture(autouse=True)
def integration_settings(monkeypatch):
    monkeypatch.setenv("APP_ENV", "development")
    monkeypatch.setenv("PAYMENT_API_MODE", "mock")
    monkeypatch.setenv("ASTRO_API_MODE", "mock")
    monkeypatch.setenv("ALLOW_DEV_TELEGRAM_AUTH", "true")
    settings.app_env = "development"
    settings.payment_api_mode = "mock"
    settings.astro_api_mode = "mock"
    settings.allow_dev_telegram_auth = True
    payment_client.MOCK_PAYMENTS.clear()
    yield


@pytest.fixture()
def end_user_client(client: TestClient) -> TestClient:
    settings.app_env = "development"
    settings.allow_dev_telegram_auth = True
    settings.telegram_bot_token = ""
    response = client.post(
        "/api/telegram/validate-init-data",
        json={"tenantSlug": "mystic-dark", "initData": DEV_INIT_DATA},
    )
    assert response.status_code == 200
    return client


def _admin_login(client: TestClient, seeded_db: Session) -> None:
    admin = seeded_db.get(Account, "account_admin")
    assert admin is not None
    response = client.post("/auth/login", json={"email": admin.email, "password": "admin123!"})
    assert response.status_code == 200


def _start_paid_checkout(client: TestClient, seeded_db: Session) -> dict:
    response = client.post(
        "/api/checkout/start",
        json={
            "tenantId": "tenant_mystic",
            "tenantSlug": "mystic-dark",
            **CHECKOUT_WITH_PARTNER,
            "theme": "money",
            "locale": "en",
            "birth": {
                "name": "Finance Test",
                "birthDate": "1990-01-01",
                "birthTime": "12:00",
                "timeAccuracy": "exact",
                "birthPlace": "Paris",
            },
        },
    )
    assert response.status_code == 200
    checkout = response.json()["data"]
    payment_client.payment_client.mock_mark_paid(checkout["paymentId"])
    client.post(
        f"/api/checkout/{checkout['orderId']}/confirm-return",
        json={"orderId": checkout["orderId"], "returnState": "success"},
    )
    seeded_db.expire_all()
    return checkout


def test_paid_payment_creates_finance_records(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    payment = (
        seeded_db.query(Payment).filter(Payment.order_id == checkout["orderId"]).first()
    )
    assert payment is not None
    assert payment.status == "paid"

    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
    assert commission is not None
    assert commission.partner_id == "partner_luna"
    assert commission.status == "pending"

    ledger_count = (
        seeded_db.query(LedgerEntry)
        .filter(LedgerEntry.order_id == checkout["orderId"])
        .count()
    )
    assert ledger_count >= 2

    balance = (
        seeded_db.query(PartnerBalance)
        .filter(
            PartnerBalance.tenant_id == "tenant_mystic",
            PartnerBalance.partner_id == "partner_luna",
        )
        .first()
    )
    assert balance is not None
    assert balance.pending_balance > 0


def test_repeated_payment_sync_is_idempotent(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    asyncio.run(sync_order_payment(seeded_db, "tenant_mystic", checkout["orderId"]))
    asyncio.run(sync_order_payment(seeded_db, "tenant_mystic", checkout["orderId"]))
    count = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).count()
    )
    assert count == 1


def test_release_commission_moves_pending_to_available(
    end_user_client: TestClient, seeded_db: Session
):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
    assert commission is not None
    pending_before = commission.commission_amount
    release_commission_to_available(
        seeded_db,
        commission.id,
        admin_account_id="account_admin",
        tenant_id="tenant_mystic",
    )
    seeded_db.commit()
    seeded_db.expire_all()
    balance = (
        seeded_db.query(PartnerBalance)
        .filter(
            PartnerBalance.partner_id == "partner_luna",
            PartnerBalance.tenant_id == "tenant_mystic",
        )
        .first()
    )
    assert balance is not None
    assert balance.available_balance >= pending_before
    commission = seeded_db.get(Commission, commission.id)
    assert commission.status == "available"


def test_payout_workflow(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
    release_commission_to_available(
        seeded_db,
        commission.id,
        admin_account_id="account_admin",
        tenant_id="tenant_mystic",
    )
    seeded_db.commit()
    seeded_db.expire_all()

    balance = (
        seeded_db.query(PartnerBalance)
        .filter(
            PartnerBalance.partner_id == "partner_luna",
            PartnerBalance.tenant_id == "tenant_mystic",
        )
        .first()
    )
    amount = min(10.0, balance.available_balance)
    draft = create_payout_draft(
        seeded_db,
        "tenant_mystic",
        "partner_luna",
        amount,
        "USD",
        admin_account_id="account_admin",
    )
    approve_payout(
        seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic"
    )
    mark_payout_paid(
        seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic"
    )
    seeded_db.commit()
    seeded_db.expire_all()

    payout = seeded_db.get(Payout, draft["id"])
    assert payout.status == "paid"
    balance = (
        seeded_db.query(PartnerBalance)
        .filter(
            PartnerBalance.partner_id == "partner_luna",
            PartnerBalance.tenant_id == "tenant_mystic",
        )
        .first()
    )
    assert balance.paid_out_total >= amount


def test_payout_exceeds_available_rejected(end_user_client: TestClient, seeded_db: Session):
    from backend_common.errors import AppError

    with pytest.raises(AppError):
        create_payout_draft(
            seeded_db,
            "tenant_mystic",
            "partner_luna",
            999999.0,
            "USD",
            admin_account_id="account_admin",
        )


def test_refund_cancels_commission(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    mark_payment_refunded(
        seeded_db,
        "tenant_mystic",
        checkout["orderId"],
        reason="Test refund",
        actor_account_id="account_admin",
    )
    seeded_db.commit()
    seeded_db.expire_all()
    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
    assert commission.status == "cancelled"
    order = get_order(seeded_db, checkout["orderId"])
    assert order.payment_status == "refunded"


def test_admin_can_list_payments(client: TestClient, seeded_db: Session):
    _admin_login(client, seeded_db)
    response = client.get("/api/dashboard/tenants/tenant_mystic/ops/payments")
    assert response.status_code == 200


def test_commission_uses_partner_rate(end_user_client: TestClient, seeded_db: Session):
    checkout = _start_paid_checkout(end_user_client, seeded_db)
    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
    order = get_order(seeded_db, checkout["orderId"])
    assert commission.commission_rate == 0.4
    assert commission.commission_amount == round(order.amount * 0.4, 2)


def test_production_forbids_mock_payment_mode():
    from backend_common.production_checks import ProductionSettingsError, validate_integration_settings

    with pytest.raises(ProductionSettingsError, match="PAYMENT_API_MODE=mock"):
        validate_integration_settings(
            app_env="production",
            payment_api_mode="mock",
            payment_api_base_url="",
            payment_api_token="",
            astro_api_mode="remote",
            astro_api_base_url="http://astro",
            astro_api_token="",
        )


def test_manual_adjustment_requires_reason(seeded_db: Session):
    from backend_common.errors import AppError
    from saas_api.services.finance_service import create_manual_adjustment

    with pytest.raises(AppError, match="reason"):
        create_manual_adjustment(
            seeded_db,
            "tenant_mystic",
            "partner_luna",
            10.0,
            "USD",
            "",
            admin_account_id="account_admin",
        )


def test_mark_payout_paid_twice_rejected(end_user_client: TestClient, seeded_db: Session):
    from backend_common.errors import AppError

    checkout = _start_paid_checkout(end_user_client, seeded_db)
    commission = (
        seeded_db.query(Commission).filter(Commission.order_id == checkout["orderId"]).first()
    )
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
        "partner_luna",
        5.0,
        "USD",
        admin_account_id="account_admin",
    )
    approve_payout(seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic")
    mark_payout_paid(seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic")
    seeded_db.commit()
    with pytest.raises(AppError, match="already marked paid"):
        mark_payout_paid(seeded_db, draft["id"], admin_account_id="account_admin", tenant_id="tenant_mystic")


def test_verify_partner_balance_ok(end_user_client: TestClient, seeded_db: Session):
    from saas_api.services.finance_service import verify_partner_balance

    _start_paid_checkout(end_user_client, seeded_db)
    result = verify_partner_balance(seeded_db, "tenant_mystic", "partner_luna", "USD")
    assert result["status"] == "ok"
