from fastapi import Depends, Request
from sqlalchemy.orm import Session

from backend_common.errors import ApiErrorCode, AppError
from saas_api.auth.sessions import decode_end_user_session_token
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from saas_api.settings import settings


def _unauthorized(message: str = "Authentication required") -> AppError:
    return AppError(ApiErrorCode.UNAUTHORIZED, message, status_code=401)


def get_end_user_session_token(request: Request) -> str | None:
    return request.cookies.get(settings.end_user_cookie_name)


def get_current_end_user(
    request: Request,
    db: Session = Depends(get_db),
) -> EndUser:
    token = get_end_user_session_token(request)
    if not token:
        raise _unauthorized()
    payload = decode_end_user_session_token(token)
    if not payload or not payload.get("sub"):
        raise _unauthorized("Invalid or expired session")
    end_user = db.get(EndUser, payload["sub"])
    if not end_user:
        raise _unauthorized("End user not found")
    return end_user
