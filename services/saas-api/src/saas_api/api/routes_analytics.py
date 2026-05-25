from typing import Any

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from backend_common.envelope import success_response
from saas_api.auth.dependencies import get_current_account, get_session_token
from saas_api.auth.end_user_dependencies import get_end_user_session_token
from saas_api.auth.sessions import decode_end_user_session_token, decode_session_token
from saas_api.db.models.account import Account, AccountStatus
from saas_api.db.models.end_user import EndUser
from saas_api.db.session import get_db
from saas_api.schemas.analytics import TrackAnalyticsEventsRequest
from saas_api.services import analytics_service
from saas_api.settings import settings

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def _optional_end_user(request: Request, db: Session) -> EndUser | None:
    token = get_end_user_session_token(request)
    if not token:
        return None
    payload = decode_end_user_session_token(token)
    if not payload or not payload.get("sub"):
        return None
    return db.get(EndUser, payload["sub"])


def _optional_account(request: Request, db: Session) -> Account | None:
    token = get_session_token(request)
    if not token:
        return None
    payload = decode_session_token(token)
    if not payload or not payload.get("sub"):
        return None
    account = db.get(Account, payload["sub"])
    if not account or account.status != AccountStatus.ACTIVE:
        return None
    return account


@router.post("/events")
def track_events(
    body: TrackAnalyticsEventsRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    end_user = _optional_end_user(request, db)
    account = _optional_account(request, db)
    events = [event.model_dump(by_alias=True) for event in body.events]
    analytics_service.ingest_events(db, events, end_user=end_user, account=account)
    return success_response({"accepted": True}, request_id=getattr(request.state, "request_id", None))
