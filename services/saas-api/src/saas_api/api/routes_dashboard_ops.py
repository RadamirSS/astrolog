from typing import Any

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.dependencies import assert_tenant_member_or_platform_admin, get_current_account, is_platform_admin
from saas_api.db.models.account import Account
from saas_api.db.session import get_db
from saas_api.services import ops_seed_service
from saas_api.services.partner_service import get_partner_db, list_partners_db
from saas_api.services.audit_service import log_action
from saas_api.services.finance_access import (
    assert_finance_admin,
    assert_finance_admin_read,
    assert_finance_read_access,
    assert_partner_access,
    resolve_partner_scope,
)
from saas_api.services.ops_access import (
    assert_ops_admin,
    assert_ops_read_access,
    assert_order_partner_access,
    resolve_order_partner_scope,
)
from saas_api.services.finance_service import (
    approve_payout,
    cancel_commission_for_refund,
    cancel_payout,
    create_manual_adjustment,
    create_payout_draft,
    hold_commission,
    mark_payment_refunded,
    mark_payout_failed,
    mark_payout_paid,
    release_commission_to_available,
    verify_partner_balance,
)
from saas_api.services.finance_store import (
    commission_summary_from_db,
    get_payment_db,
    list_balances_db,
    list_commissions_db,
    list_ledger_db,
    list_payments_db,
    list_payout_methods_db,
    list_payouts_db,
)
from saas_api.services.product_economics_service import compute_product_economics
from saas_api.services.order_lifecycle_service import (
    approve_mock_payment,
    compute_revenue_summary,
    get_order_for_tenant_dict,
    list_orders_for_tenant,
    mock_payment_approval_allowed,
    retry_order_report,
    revoke_entitlement,
    set_order_needs_review,
    sync_order_payment,
    sync_order_report,
    unlock_entitlement,
)

router = APIRouter(prefix="/api/dashboard/tenants/{tenant_id}/ops", tags=["dashboard-ops"])


def _assert_access(tenant_id: str, account: Account, db: Session) -> None:
    assert_tenant_member_or_platform_admin(db, account, tenant_id)


@router.get("/orders")
def list_orders(
    tenant_id: str,
    request: Request,
    status: str | None = None,
    productType: str | None = None,
    partnerId: str | None = None,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_read_access(db, account, tenant_id)
    scope = resolve_order_partner_scope(account, partnerId)
    params = {"status": status, "productType": productType, "partnerId": scope}
    data = list_orders_for_tenant(db, tenant_id, params)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/orders/{order_id}")
def get_order(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_read_access(db, account, tenant_id)
    data = get_order_for_tenant_dict(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    assert_order_partner_access(account, data.get("partnerId"))
    data["mockPaymentApprovalAllowed"] = mock_payment_approval_allowed()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/sync-payment")
async def sync_payment(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_read_access(db, account, tenant_id)
    existing = get_order_for_tenant_dict(db, tenant_id, order_id)
    if not existing:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    assert_order_partner_access(account, existing.get("partnerId"))
    data = await sync_order_payment(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/sync-report")
async def sync_report(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_admin(account)
    data = await sync_order_report(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/retry-report")
async def retry_report(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_admin(account)
    data = await retry_order_report(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/set-needs-review")
def needs_review(
    tenant_id: str,
    order_id: str,
    request: Request,
    body: dict[str, Any] | None = None,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_read_access(db, account, tenant_id)
    existing = get_order_for_tenant_dict(db, tenant_id, order_id)
    if not existing:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    assert_order_partner_access(account, existing.get("partnerId"))
    needs = True if body is None else bool(body.get("needsReview", True))
    data = set_order_needs_review(db, tenant_id, order_id, needs)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/entitlement/revoke")
def revoke(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_admin(account)
    data = revoke_entitlement(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    log_action(
        db,
        action="entitlement.revoke",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"orderId": order_id},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/entitlement/unlock")
def unlock(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_admin(account)
    data = unlock_entitlement(db, tenant_id, order_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    log_action(
        db,
        action="entitlement.unlock",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"orderId": order_id},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/revenue")
def revenue_summary(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin_read(account)
    data = compute_revenue_summary(db, tenant_id)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/approve-mock-payment")
async def approve_mock_payment_route(
    tenant_id: str,
    order_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_ops_admin(account)
    data = await approve_mock_payment(
        db, tenant_id, order_id, actor_account_id=account.id
    )
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    log_action(
        db,
        action="order.mock_payment_approved",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"orderId": order_id},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/partners")
def list_partners(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    partners = list_partners_db(db, tenant_id)
    if not is_platform_admin(account):
        assert_finance_read_access(db, account, tenant_id)
        partners = [p for p in partners if p.get("id") == account.partner_id]
    return success_response(
        partners,
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/partners/{partner_id}")
def get_partner(
    tenant_id: str,
    partner_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    assert_partner_access(account, partner_id)
    data = get_partner_db(db, tenant_id, partner_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Partner not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/commissions")
def list_commissions(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    data = list_commissions_db(db, tenant_id, partner_id=scope)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/commissions/summary")
def commission_summary(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    summary = commission_summary_from_db(db, tenant_id, partner_id=scope)
    return success_response(summary, request_id=getattr(request.state, "request_id", None))


@router.post("/commissions/{commission_id}/release")
def release_commission(
    tenant_id: str,
    commission_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    data = release_commission_to_available(
        db, commission_id, admin_account_id=account.id, tenant_id=tenant_id
    )
    log_action(
        db,
        action="commission.release",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"commissionId": commission_id},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/commissions/{commission_id}/hold")
def hold_commission_route(
    tenant_id: str,
    commission_id: str,
    body: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    reason = str(body.get("reason") or "Manual hold")
    data = hold_commission(
        db,
        commission_id,
        reason=reason,
        admin_account_id=account.id,
        tenant_id=tenant_id,
    )
    log_action(
        db,
        action="commission.hold",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"commissionId": commission_id, "reason": reason},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/payouts")
def list_payouts(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    data = list_payouts_db(db, tenant_id, partner_id=scope)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/payouts")
def create_payout(
    tenant_id: str,
    body: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    data = create_payout_draft(
        db,
        tenant_id,
        str(body["partnerId"]),
        float(body["amount"]),
        str(body.get("currency") or "USD"),
        admin_account_id=account.id,
        notes=body.get("notes"),
    )
    log_action(
        db,
        action="payout.create",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"payoutId": data["id"], "amount": data["amount"]},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.patch("/payouts/{payout_id}")
def update_payout(
    tenant_id: str,
    payout_id: str,
    body: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    action = body.get("action") or body.get("status")
    data: dict[str, Any] | None = None
    if action in ("approve", "approved"):
        data = approve_payout(db, payout_id, admin_account_id=account.id, tenant_id=tenant_id)
        log_action(
            db,
            action="payout.approve",
            actor_account_id=account.id,
            tenant_id=tenant_id,
            payload={"payoutId": payout_id},
        )
    elif action in ("paid", "mark_paid"):
        data = mark_payout_paid(
            db,
            payout_id,
            admin_account_id=account.id,
            tenant_id=tenant_id,
            note=body.get("notes"),
        )
        log_action(
            db,
            action="payout.paid",
            actor_account_id=account.id,
            tenant_id=tenant_id,
            payload={"payoutId": payout_id},
        )
    elif action in ("failed", "mark_failed"):
        data = mark_payout_failed(
            db,
            payout_id,
            admin_account_id=account.id,
            tenant_id=tenant_id,
            reason=str(body.get("reason") or body.get("notes") or "Manual failure"),
        )
        log_action(
            db,
            action="payout.failed",
            actor_account_id=account.id,
            tenant_id=tenant_id,
            payload={"payoutId": payout_id},
        )
    elif action in ("cancel", "cancelled"):
        data = cancel_payout(db, payout_id, admin_account_id=account.id, tenant_id=tenant_id)
        log_action(
            db,
            action="payout.cancel",
            actor_account_id=account.id,
            tenant_id=tenant_id,
            payload={"payoutId": payout_id},
        )
    else:
        data = ops_seed_service.update_payout(tenant_id, payout_id, body)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Payout not found", status_code=404)
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/payout-methods")
def list_payout_methods(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    data = list_payout_methods_db(db, tenant_id, partner_id=scope)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/payments")
def list_payments(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    status: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    data = list_payments_db(db, tenant_id, partner_id=scope, status=status)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/payments/{payment_id}")
def get_payment(
    tenant_id: str,
    payment_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    from saas_api.db.models.payment import Payment
    from saas_api.db.models.order import Order

    payment_row = (
        db.query(Payment)
        .filter(Payment.tenant_id == tenant_id, Payment.id == payment_id)
        .first()
    )
    if payment_row:
        order = db.query(Order).filter(Order.id == payment_row.order_id).first()
        if order and order.partner_id:
            assert_partner_access(account, order.partner_id)
    data = get_payment_db(db, tenant_id, payment_id)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Payment not found", status_code=404)
    if not is_platform_admin(account):
        data.pop("rawProviderPayload", None)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/orders/{order_id}/mark-refunded")
def mark_order_refunded(
    tenant_id: str,
    order_id: str,
    body: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    reason = str(body.get("reason") or "Manual refund")
    data = mark_payment_refunded(
        db, tenant_id, order_id, reason=reason, actor_account_id=account.id
    )
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Order not found", status_code=404)
    log_action(
        db,
        action="payment.refunded",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"orderId": order_id, "reason": reason},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/balances")
def list_balances(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    scope = resolve_partner_scope(account, partnerId)
    data = list_balances_db(db, tenant_id, partner_id=scope)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/balances/{partner_id}")
def get_balance(
    tenant_id: str,
    partner_id: str,
    request: Request,
    currency: str = Query(default="USD"),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    assert_partner_access(account, partner_id)
    rows = list_balances_db(db, tenant_id, partner_id=partner_id)
    data = next((r for r in rows if r["currency"] == currency), None)
    if not data:
        from backend_common.errors import ApiErrorCode, AppError

        raise AppError(ApiErrorCode.NOT_FOUND, "Balance not found", status_code=404)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/balances/{partner_id}/verify")
def verify_balance(
    tenant_id: str,
    partner_id: str,
    request: Request,
    currency: str = Query(default="USD"),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    data = verify_partner_balance(db, tenant_id, partner_id, currency)
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.post("/balances/{partner_id}/adjustments")
def create_adjustment(
    tenant_id: str,
    partner_id: str,
    body: dict[str, Any],
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin(account)
    data = create_manual_adjustment(
        db,
        tenant_id,
        partner_id,
        float(body["amount"]),
        str(body.get("currency") or "USD"),
        str(body.get("reason") or ""),
        admin_account_id=account.id,
    )
    log_action(
        db,
        action="balance.adjustment",
        actor_account_id=account.id,
        tenant_id=tenant_id,
        payload={"partnerId": partner_id, "amount": body["amount"]},
    )
    db.commit()
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/ledger")
def list_ledger(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    type: str | None = Query(default=None),
    currency: str | None = Query(default=None),
    orderId: str | None = Query(default=None),
    paymentId: str | None = Query(default=None),
    payoutId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin_read(account)
    scope = resolve_partner_scope(account, partnerId)
    data = list_ledger_db(
        db,
        tenant_id,
        partner_id=scope,
        entry_type=type,
        currency=currency,
        order_id=orderId,
        payment_id=paymentId,
        payout_id=payoutId,
    )
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/partners/{partner_id}/finance")
def partner_finance(
    tenant_id: str,
    partner_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_read_access(db, account, tenant_id)
    assert_partner_access(account, partner_id)
    balances = list_balances_db(db, tenant_id, partner_id=partner_id)
    commissions = list_commissions_db(db, tenant_id, partner_id=partner_id, limit=10)
    payouts = list_payouts_db(db, tenant_id, partner_id=partner_id)[:10]
    summary = commission_summary_from_db(db, tenant_id, partner_id=partner_id)
    data = {
        "partnerId": partner_id,
        "balances": balances,
        "commissionSummary": summary,
        "recentCommissions": commissions,
        "recentPayouts": payouts,
    }
    return success_response(data, request_id=getattr(request.state, "request_id", None))


@router.get("/promo-materials")
def promo_materials(
    tenant_id: str,
    request: Request,
    partnerId: str | None = Query(default=None),
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    return success_response(
        ops_seed_service.list_promo_materials(tenant_id, partnerId),
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/product-economics")
def product_economics(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    assert_finance_admin_read(account)
    return success_response(
        compute_product_economics(db, tenant_id),
        request_id=getattr(request.state, "request_id", None),
    )


@router.get("/funnel-analytics")
def funnel_analytics(
    tenant_id: str,
    request: Request,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> dict:
    _assert_access(tenant_id, account, db)
    return success_response(
        ops_seed_service.get_funnel_analytics(tenant_id),
        request_id=getattr(request.state, "request_id", None),
    )
