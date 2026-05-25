from fastapi import Depends, Request
from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.sessions import decode_session_token
from saas_api.db.models.account import Account, AccountRole, AccountStatus
from saas_api.db.models.tenant_member import TenantMember, TenantMemberRole
from saas_api.db.session import get_db
from saas_api.settings import settings


def _unauthorized(message: str = "Authentication required") -> AppError:
    return AppError(ApiErrorCode.UNAUTHORIZED, message, status_code=401)


def _forbidden(message: str = "Forbidden") -> AppError:
    return AppError(ApiErrorCode.FORBIDDEN, message, status_code=403)


def get_session_token(request: Request) -> str | None:
    return request.cookies.get(settings.saas_cookie_name)


def get_current_account(
    request: Request,
    db: Session = Depends(get_db),
) -> Account:
    token = get_session_token(request)
    if not token:
        raise _unauthorized()
    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        raise _unauthorized("Invalid or expired session")
    account = db.get(Account, payload["sub"])
    if not account or account.status != AccountStatus.ACTIVE:
        raise _unauthorized("Account not found or disabled")
    return account


def require_platform_owner_or_admin(account: Account = Depends(get_current_account)) -> Account:
    if account.role not in (AccountRole.PLATFORM_OWNER, AccountRole.PLATFORM_ADMIN):
        raise _forbidden("Platform owner or admin access required")
    return account


def is_platform_admin(account: Account) -> bool:
    return account.role in (AccountRole.PLATFORM_OWNER, AccountRole.PLATFORM_ADMIN)


def assert_tenant_member_or_platform_admin(db: Session, account: Account, tenant_id: str) -> None:
    if is_platform_admin(account):
        return
    member = (
        db.query(TenantMember)
        .filter(TenantMember.tenant_id == tenant_id, TenantMember.account_id == account.id)
        .first()
    )
    if not member:
        raise _forbidden("You do not have access to this tenant")


def assert_tenant_owner_or_platform_admin(db: Session, account: Account, tenant_id: str) -> None:
    if is_platform_admin(account):
        return
    member = (
        db.query(TenantMember)
        .filter(TenantMember.tenant_id == tenant_id, TenantMember.account_id == account.id)
        .first()
    )
    if not member or member.role != TenantMemberRole.OWNER:
        raise _forbidden("Tenant owner access required")


def get_tenant_member_role(
    db: Session, account: Account, tenant_id: str
) -> TenantMemberRole | None:
    if is_platform_admin(account):
        return TenantMemberRole.OWNER
    member = (
        db.query(TenantMember)
        .filter(TenantMember.tenant_id == tenant_id, TenantMember.account_id == account.id)
        .first()
    )
    if not member:
        return None
    return TenantMemberRole(member.role)
