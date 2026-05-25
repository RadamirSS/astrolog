from datetime import UTC, datetime

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.dependencies import get_current_account
from saas_api.auth.passwords import verify_password
from saas_api.auth.sessions import clear_session_cookie, create_session_token, set_session_cookie
from saas_api.db.models.account import Account, AccountStatus
from saas_api.db.session import get_db
from saas_api.schemas.auth import AccountSummary, LoginRequest, LoginResponse
from saas_api.services.audit_service import log_action

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict:
    account = db.query(Account).filter(Account.email == body.email).first()
    if not account or not verify_password(body.password, account.password_hash):
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Invalid email or password", status_code=401)
    if account.status != AccountStatus.ACTIVE:
        raise AppError(ApiErrorCode.UNAUTHORIZED, "Account is disabled", status_code=401)

    account.last_login_at = datetime.now(UTC)
    log_action(db, action="login", actor_account_id=account.id)
    db.commit()

    token = create_session_token(account_id=account.id, email=account.email, role=account.role)
    set_session_cookie(response, token)

    data = LoginResponse(
        account=AccountSummary(
            id=account.id,
            email=account.email,
            role=account.role,
            partner_id=account.partner_id,
        )
    )
    return success_response(
        data.model_dump(),
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/logout")
def logout(request: Request, response: Response) -> dict:
    clear_session_cookie(response)
    return success_response({}, request_id=getattr(request.state, "request_id", None))


@router.get("/me")
def me(
    request: Request,
    account: Account = Depends(get_current_account),
) -> dict:
    data = AccountSummary(
        id=account.id,
        email=account.email,
        role=account.role,
        partner_id=account.partner_id,
    )
    return success_response(
        data.model_dump(),
        request_id=getattr(request.state, "request_id", None),
    )
