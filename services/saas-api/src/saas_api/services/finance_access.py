"""Finance API access control helpers."""

from __future__ import annotations

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.dependencies import get_tenant_member_role, is_platform_admin
from saas_api.db.models.account import Account
from saas_api.db.models.tenant_member import TenantMemberRole
from sqlalchemy.orm import Session


def _forbidden(message: str) -> AppError:
    return AppError(ApiErrorCode.FORBIDDEN, message, status_code=403)


def assert_finance_admin(account: Account) -> None:
    if not is_platform_admin(account):
        raise _forbidden("Platform admin access required for this finance action")


def assert_finance_read_access(db: Session, account: Account, tenant_id: str) -> None:
    """Allow platform admins or tenant members with a scoped partner_id."""
    if is_platform_admin(account):
        return
    role = get_tenant_member_role(db, account, tenant_id)
    if role is None:
        raise _forbidden("You do not have access to this tenant")
    if not account.partner_id:
        raise _forbidden("Finance access requires a partner-scoped account")


def assert_finance_admin_read(account: Account) -> None:
    """Platform-only finance reads (ledger, revenue, product economics)."""
    if not is_platform_admin(account):
        raise _forbidden("Platform admin access required for this finance view")


def resolve_partner_scope(account: Account, requested_partner_id: str | None) -> str | None:
    """Return partner_id filter for scoped accounts; None means all partners (admin)."""
    if is_platform_admin(account):
        return requested_partner_id
    if not account.partner_id:
        raise _forbidden("Finance access requires a partner-scoped account")
    if requested_partner_id and requested_partner_id != account.partner_id:
        raise _forbidden("You can only access your own partner finance data")
    return account.partner_id


def assert_partner_access(account: Account, partner_id: str) -> None:
    if is_platform_admin(account):
        return
    if not account.partner_id:
        raise _forbidden("Finance access requires a partner-scoped account")
    if account.partner_id != partner_id:
        raise _forbidden("You can only access your own partner finance data")


def assert_tenant_finance_role(
    db: Session,
    account: Account,
    tenant_id: str,
    *,
    allow_viewer: bool = True,
) -> None:
    """Ensure tenant member role is allowed for finance reads."""
    if is_platform_admin(account):
        return
    role = get_tenant_member_role(db, account, tenant_id)
    if role is None:
        raise _forbidden("You do not have access to this tenant")
    if not allow_viewer and role == TenantMemberRole.VIEWER:
        raise _forbidden("Viewer accounts cannot perform this finance action")
