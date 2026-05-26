"""Dashboard ops access control helpers."""

from __future__ import annotations

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.dependencies import get_tenant_member_role, is_platform_admin
from saas_api.db.models.account import Account
from sqlalchemy.orm import Session


def _forbidden(message: str) -> AppError:
    return AppError(ApiErrorCode.FORBIDDEN, message, status_code=403)


def assert_ops_admin(account: Account) -> None:
    if not is_platform_admin(account):
        raise _forbidden("Platform admin access required for this operation")


def assert_ops_read_access(db: Session, account: Account, tenant_id: str) -> None:
    """Allow platform admins or tenant members with a scoped partner_id."""
    if is_platform_admin(account):
        return
    role = get_tenant_member_role(db, account, tenant_id)
    if role is None:
        raise _forbidden("You do not have access to this tenant")
    if not account.partner_id:
        raise _forbidden("Order access requires a partner-scoped account")


def resolve_order_partner_scope(account: Account, requested_partner_id: str | None) -> str | None:
    """Return partner_id filter for scoped accounts; None means all partners (admin)."""
    if is_platform_admin(account):
        return requested_partner_id
    if not account.partner_id:
        raise _forbidden("Order access requires a partner-scoped account")
    if requested_partner_id and requested_partner_id != account.partner_id:
        raise _forbidden("You can only access your own partner orders")
    return account.partner_id


def assert_order_partner_access(account: Account, order_partner_id: str | None) -> None:
    if is_platform_admin(account):
        return
    if not account.partner_id:
        raise _forbidden("Order access requires a partner-scoped account")
    if not order_partner_id:
        raise _forbidden("You can only access orders attributed to your partner")
    if account.partner_id != order_partner_id:
        raise _forbidden("You can only access your own partner orders")
